import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';

import { User } from '../entities/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { FilterUserDto } from '../dto/filter-user.dto';
import { ChangePasswordUserDto } from '../dto/account/change-password-user.dto';
import { RecuperatePasswordUserDto } from '../dto/account/recuperate-password-user.dto';
import { ChangeUserStatusDto } from '../dto/account/change-status.dto';
import { UserAccountService } from './user-account.service';
import { UserRegistrationService } from './user-registration.service';
import { DatabaseError } from 'src/interfaces/DatabaseError';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly i18n: I18nService,
    private readonly userAccountService: UserAccountService,
    private readonly userRegistrationService: UserRegistrationService,
  ) {}

  /**
   * Crea un nuevo usuario y su perfil de personal mediante el orquestador transaccional.
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    const savedUserId =
      await this.userRegistrationService.register(createUserDto);
    return await this.findOne(savedUserId);
  }

  /**
   * Obtiene la lista paginada y filtrada de usuarios junto con los datos de personal y rol.
   */
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

  /**
   * Busca un usuario por su ID incluyendo sus relaciones esenciales.
   */
  async findOne(id: string): Promise<User> {
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

  /**
   * Actualiza datos de cuenta y expediente de personal a través del orquestador transaccional.
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    await this.userRegistrationService.update(id, updateUserDto);
    return await this.findOne(id);
  }

  /**
   * Elimina un usuario por su ID.
   */
  async remove(id: string): Promise<User> {
    try {
      const user = await this.findOne(id);
      await this.usersRepository.delete(id);
      return user;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  /**
   * Busca un usuario activo por su correo electrónico.
   */
  async findByEmail(email: string): Promise<User | null> {
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

  /**
   * Busca un usuario por el ID de su perfil de personal asociado.
   */
  async findOneByStaffId(idStaff: string): Promise<User | null> {
    return await this.usersRepository.findOne({
      where: {
        staff: {
          id: idStaff,
        },
      },
    });
  }

  /**
   * Busca un usuario por ID verificando su existencia.
   */
  async findById(id: string): Promise<User> {
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

  /**
   * Desactiva la cuenta de un usuario.
   */
  async deactivate(id: string): Promise<{ id: string; status: boolean }> {
    return this.changeStatus(id, { status: false });
  }

  /**
   * Activa la cuenta de un usuario.
   */
  async activate(id: string): Promise<{ id: string; status: boolean }> {
    return this.changeStatus(id, { status: true });
  }

  /**
   * Cambia el estado de activación delegando a UserAccountService.
   */
  async changeStatus(
    id: string,
    changeStatusDto: ChangeUserStatusDto,
  ): Promise<{ id: string; status: boolean }> {
    return await this.userAccountService.changeStatus(id, changeStatusDto);
  }

  /**
   * Trunca las tablas user y staff (uso administrativo/seed).
   */
  async deleteAllUsers(): Promise<{ deleted: boolean }> {
    try {
      await this.usersRepository.query(`
        TRUNCATE TABLE "user", "staff" CASCADE;
      `);
      return { deleted: true };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  /**
   * Obtiene el perfil del usuario autenticado.
   */
  async profile(user: User): Promise<User> {
    return await this.findOne(user.id);
  }

  /**
   * Cambia la contraseña del usuario delegando a UserAccountService.
   */
  async passwordChange(
    changePasswordUser: ChangePasswordUserDto,
    user: User,
  ): Promise<{ message: string }> {
    return await this.userAccountService.passwordChange(
      changePasswordUser,
      user,
    );
  }

  /**
   * Solicita recuperación de contraseña delegando a UserAccountService.
   */
  async recuperatePassword(
    recuperatePasswordUser: RecuperatePasswordUserDto,
  ): Promise<{ message: string; email: string }> {
    const user = await this.findByEmail(recuperatePasswordUser.email);
    if (!user) {
      throw new NotFoundException(
        this.i18n.t('errors.users.emailNotRegistered', {
          args: { email: recuperatePasswordUser.email },
        }),
      );
    }
    return await this.userAccountService.recuperatePassword(
      recuperatePasswordUser,
      user,
    );
  }

  /**
   * Obtiene las preferencias de notificación del usuario.
   */
  async getPreferences(userId: string): Promise<Record<string, boolean>> {
    return await this.userAccountService.getPreferences(userId);
  }

  /**
   * Actualiza las preferencias de notificación del usuario.
   */
  async updatePreferences(
    userId: string,
    preferences: Record<string, boolean>,
  ): Promise<Record<string, boolean>> {
    return await this.userAccountService.updatePreferences(userId, preferences);
  }

  private handleDBExeptions(error: unknown): never {
    return this.handleDBExceptions(error);
  }

  private handleDBExceptions(error: unknown): never {
    const dbError = error as DatabaseError;
    if (dbError.code === '23505') {
      throw new ConflictException(dbError.detail);
    }
    if (dbError.code === '23503') {
      throw new BadRequestException(dbError.detail);
    }
    this.logger.error(error);
    throw new InternalServerErrorException(
      'Unexpected error, check the server logs',
    );
  }
}
