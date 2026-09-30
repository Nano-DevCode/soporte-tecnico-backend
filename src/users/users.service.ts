import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Brackets, Repository } from 'typeorm';
import { Role } from 'src/roles/entities/role.entity';
import { DataSource } from 'typeorm';

import * as bcrypt from 'bcrypt';
import { Staff } from 'src/staff/entities/staff.entity';
import { FilterUserDto } from './dto/filter-user.dto';
import { GmailBotService } from 'src/gmail-bot/gmail-bot.service';
import { RecuperatePasswordUserDto } from './dto/recuperate-password-user.dto';
import { generateTempPassword } from './util/generateTempPassword.util';
import { ChangePasswordUserDto } from './dto/change-password-user.dto';
import { notificationRecuperatePasswordTemplate } from './templates/notification-recuperate-password.template';
import { notificationChangedPasswordContent } from './templates/notification-changed-password';
import { CoordinationsService } from 'src/coordinations/coordinations.service';
import { ChangeUserStatusDto } from './dto/change-status.dto';
import { RolesService } from '../roles/roles.service';
import { DatabaseError } from 'src/interfaces/DatabaseError';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class UsersService {
  private readonly logger = new Logger('UsersService');
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly gmailBotService: GmailBotService,
    private readonly coordinationsService: CoordinationsService,
    private readonly rolesService: RolesService,
    private readonly i18n: I18nService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const {
      password,
      roleId,
      departmentId,
      coordinationId,
      idTelegram,
      num_control,
      name,
      maternalSurname,
      paternalSurname,
      rfc,
      ...userData
    } = createUserDto;

    try {
      // 1. Iniciamos la transacción. Todo dentro de esta función usa el manager
      const savedUserId = await this.dataSource.transaction(async (manager) => {
        const hashedPassword = await bcrypt.hash(password, 10);

        // 2. Creamos y guardamos el Usuario
        const user = manager.create(User, {
          ...userData,
          password: hashedPassword,
          role: { id: roleId },
        });
        const savedUser = await manager.save(user);

        // 3. Creamos y guardamos el Staff relacionándolo con el Usuario
        const staff = manager.create(Staff, {
          name,
          paternalSurname,
          maternalSurname,
          num_control,
          idTelegram,
          rfc,
          user: savedUser,
          department: { id: departmentId },
          coordination: {
            id:
              coordinationId ??
              (await this.coordinationsService.findUnCordination()),
          },
        });
        await manager.save(staff);

        // 4. Retornamos el ID para hacer la búsqueda final fuera de la transacción
        return savedUser.id;
      });

      // 5. Buscamos el usuario completo con sus relaciones y lo retornamos
      return await this.findOne(savedUserId);
    } catch (error) {
      this.handleDBExeptions(error);
    }
  }

  async findAll(filterDto: FilterUserDto) {
    const { limit = 10, offset = 0 } = filterDto;
    const { query, departmentId, roleId, status } = filterDto;

    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('user.staff', 'staff')
      .leftJoinAndSelect('staff.department', 'department')
      .select([
        'user.id',
        'user.email',
        'user.status',
        'user.updatedAt',
        'staff.updatedAt',
        'staff.id',
        'staff.idTelegram',
        'staff.name',
        'staff.rfc',
        'staff.paternalSurname',
        'staff.maternalSurname',
        'staff.num_control',
        'department.id',
        'department.name',
        'role.id',
        'role.name',
      ])
      .take(limit)
      .skip(offset)
      .orderBy('user.updatedAt', 'DESC')
      .addOrderBy('staff.updatedAt', 'DESC');

    if (query) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where('user.email ILIKE :query', { query: `%${query}%` }).orWhere(
            'staff.searchField ILIKE :query',
            { query: `%${query}%` },
          );
        }),
      );
    }

    if (roleId) {
      queryBuilder.andWhere('role.id = :roleId', { roleId });
    }

    if (departmentId) {
      queryBuilder.andWhere('department.id = :departmentId', { departmentId });
    }

    if (status !== undefined) {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    const [users, total] = await queryBuilder.getManyAndCount();

    return {
      users,
      meta: {
        total,
        page: Math.floor(offset / limit) + 1,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: {
        role: true,
        staff: {
          department: true,
          coordination: true,
        },
      },
      select: {
        id: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        role: {
          id: true,
          name: true,
        },
        staff: {
          id: true,
          createdAt: true,
          updatedAt: true,
          name: true,
          paternalSurname: true,
          maternalSurname: true,
          idTelegram: true,
          num_control: true,
          rfc: true,
          department: {
            id: true,
            status: true,
            priority: true,
            name: true,
            acronym: true,
          },
          coordination: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(
        this.i18n.t('errors.users.userNotFound', {
          args: { id },
        }),
      );
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    if (updateUserDto.roleId) {
      const coordinatorRoleId = await this.rolesService.findIsCoordinator();

      if (updateUserDto.roleId !== coordinatorRoleId) {
        updateUserDto.coordinationId =
          await this.coordinationsService.findUnCordination();
      }
    }

    // 1. Extraemos los campos del Staff para que no se filtren hacia el User
    const {
      roleId,
      idTelegram,
      num_control,
      departmentId,
      coordinationId,
      rfc,
      name,
      paternalSurname,
      maternalSurname,
      ...toUpdate
    } = updateUserDto;

    try {
      // Iniciamos la transacción automática
      await this.dataSource.transaction(async (manager) => {
        const user = await manager.findOne(User, {
          where: { id },
          relations: ['staff'],
        });

        if (!user) {
          throw new NotFoundException(
            this.i18n.t('errors.users.userNotFound', {
              args: { id },
            }),
          );
        }

        if (toUpdate.password) {
          toUpdate.password = await bcrypt.hash(toUpdate.password, 10);
        }

        // Actualizamos los datos base del usuario (email, password, etc.)
        manager.merge(User, user, toUpdate);

        if (roleId) {
          user.role = { id: roleId } as Role;
        }
        await manager.save(user);

        // Si tiene un staff relacionado, lo actualizamos también
        if (user.staff) {
          manager.merge(Staff, user.staff, {
            name,
            paternalSurname,
            maternalSurname,
            idTelegram,
            num_control,
            rfc,
            department: departmentId
              ? { id: departmentId }
              : user.staff.department,
            coordination: coordinationId
              ? { id: coordinationId }
              : user.staff.coordination,
          });

          await manager.save(user.staff);
        }
      });

      return await this.findOne(id);
    } catch (error) {
      this.handleDBExeptions(error);
    }
  }

  async remove(id: string) {
    try {
      const user = await this.findOne(id);
      await this.usersRepository.delete(id);
      return user;
    } catch (error) {
      this.handleDBExeptions(error);
    }
  }

  async findByEmail(email: string) {
    return await this.usersRepository.findOne({
      where: { email, status: true },
      relations: { role: true, staff: { department: true } },
      select: {
        id: true,
        email: true,
        password: true,
        status: true,
        role: {
          id: true,
          name: true,
        },
        staff: {
          name: true,
          maternalSurname: true,
          paternalSurname: true,
          department: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findOneByStaffId(idStaff: string) {
    return await this.usersRepository.findOne({
      where: {
        staff: {
          id: idStaff,
        },
      },
    });
  }

  async findById(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: { role: true, staff: { department: true } },
      select: {
        id: true,
        email: true,
        password: true,
        status: true,
        role: {
          id: true,
          name: true,
        },
        staff: {
          id: true,
          name: true,
          maternalSurname: true,
          paternalSurname: true,
          department: {
            id: true,
            name: true,
          },
        },
      },
    });
    if (!user) {
      throw new NotFoundException(
        this.i18n.t('errors.users.userNotFound', {
          args: { id },
        }),
      );
    }
    return user;
  }

  async deactivate(id: string) {
    return this.changeStatus(id, { status: false });
  }

  async activate(id: string) {
    return this.changeStatus(id, { status: true });
  }

  async changeStatus(id: string, changeStatusDto: ChangeUserStatusDto) {
    const result = await this.usersRepository.update(id, {
      status: changeStatusDto.status,
    });
    if (result.affected === 0)
      throw new NotFoundException(
        this.i18n.t('errors.users.userNotFound', {
          args: { id },
        }),
      );
    return { id, ...changeStatusDto };
  }

  async deleteAllUsers() {
    try {
      await this.usersRepository.query(`
        TRUNCATE TABLE "user", "staff" CASCADE;
      `);
      return { deleted: true };
    } catch (error) {
      this.handleDBExeptions(error);
    }
  }

  async profile(user: User) {
    return await this.findOne(user.id);
  }

  async passwordChange(changePasswordUser: ChangePasswordUserDto, user: User) {
    const id = user.id;
    const { password } = changePasswordUser;
    const foundUser = await this.usersRepository.findOne({
      where: { id },
      relations: ['staff'],
    });

    if (!foundUser) {
      throw new NotFoundException(
        this.i18n.t('errors.users.userNotFound', {
          args: { id },
        }),
      );
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    await this.usersRepository.update(user.id, {
      password: hashedPassword,
    });

    await this.gmailBotService.sendEmail(
      foundUser.email,
      'Cambio de Contraseña - Soporte Técnico',
      notificationChangedPasswordContent(
        foundUser.staff.name,
        foundUser.staff.paternalSurname,
        foundUser.staff.maternalSurname,
      ),
    );
    return { message: this.i18n.t('events.users.passwordUpdated') };
  }

  async recuperatePassword(recuperatePasswordUser: RecuperatePasswordUserDto) {
    const { email } = recuperatePasswordUser;

    const user = await this.findByEmail(email);
    if (!user) {
      throw new NotFoundException(
        this.i18n.t('errors.users.emailNotRegistered', {
          args: { email },
        }),
      );
    }

    try {
      const tempPassword = generateTempPassword();
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      await this.usersRepository.update(user.id, {
        password: hashedPassword,
      });

      await this.gmailBotService.sendEmail(
        email,
        'Recuperación de Contraseña - Soporte Técnico',
        notificationRecuperatePasswordTemplate(
          user.staff.name,
          user.staff.paternalSurname,
          user.staff.maternalSurname,
          tempPassword,
        ),
      );

      return {
        message: this.i18n.t('events.users.instructionsSent'),
        email: email,
      };
    } catch (error) {
      this.handleDBExeptions(error);
    }
  }

  async getPreferences(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['id', 'notificationPreferences'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user.notificationPreferences || {};
  }

  async updatePreferences(
    userId: string,
    preferences: Record<string, boolean>,
  ) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['id', 'notificationPreferences'],
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const currentPreferences = user.notificationPreferences || {};
    user.notificationPreferences = { ...currentPreferences, ...preferences };

    await this.usersRepository.save(user);

    return user.notificationPreferences;
  }

  private handleDBExeptions(error: unknown) {
    const dbError = error as DatabaseError;
    if (dbError.code === '23505') {
      if (dbError.detail?.includes('(email)=')) {
        throw new ConflictException(
          this.i18n.t('errors.users.emailAlreadyInUse'),
        );
      }
      if (dbError.detail?.includes('(rfc)=')) {
        throw new ConflictException(
          this.i18n.t('errors.users.rfcAlreadyInUse'),
        );
      }
      if (dbError.detail?.includes('(idTelegram)=')) {
        throw new ConflictException(
          this.i18n.t('errors.users.idTelegramAlreadyInUse'),
        );
      }
      throw new BadRequestException(dbError.detail);
    }
    if (dbError.code === '23503') {
      throw new BadRequestException(dbError.detail);
    }
    this.logger.error(error);
    throw new InternalServerErrorException(
      this.i18n.t('errors.internalServerError'),
    );
  }
}
