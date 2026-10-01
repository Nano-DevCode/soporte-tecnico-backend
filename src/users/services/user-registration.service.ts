import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { I18nService } from 'nestjs-i18n';

import { User } from '../entities/user.entity';
import { Staff } from '../entities/staff.entity';
import { Role } from 'src/auth/roles/entities/role.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { CoordinationsService } from 'src/coordinations/services/coordinations.service';
import { RolesService } from 'src/auth/roles/services/roles.service';
import { DatabaseError } from 'src/interfaces/DatabaseError';

/**
 * Servicio orquestador responsable de la creación y actualización transaccional (ACID)
 * de la dupla:
 * 1. Cuenta de Acceso (`User`): email, contraseña hasheada, rol, avatar.
 * 2. Expediente de Personal (`Staff`): nombres, apellidos, RFC, No. Control, Telegram, departamento y coordinación.
 */
@Injectable()
export class UserRegistrationService {
  private readonly logger = new Logger(UserRegistrationService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly coordinationsService: CoordinationsService,
    private readonly rolesService: RolesService,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Crea transaccionalmente el usuario (User) y su expediente laboral (Staff).
   * Si cualquiera de las dos operaciones falla, se realiza rollback automático.
   */
  async register(createUserDto: CreateUserDto): Promise<string> {
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
      const savedUserId = await this.dataSource.transaction(async (manager) => {
        // 1. Hashear contraseña para la cuenta
        const hashedPassword = await bcrypt.hash(password, 10);

        // 2. Crear y persistir la cuenta de acceso (User)
        const user = manager.create(User, {
          ...userData,
          password: hashedPassword,
          role: { id: roleId } as Role,
        });
        const savedUser = await manager.save(user);

        // 3. Resolver coordinación si no fue provista explícitamente
        const resolvedCoordinationId =
          coordinationId ??
          (await this.coordinationsService.findUnCordination());

        // 4. Crear y persistir el expediente laboral (Staff) vinculado al User
        const staff = manager.create(Staff, {
          name,
          paternalSurname,
          maternalSurname,
          num_control,
          idTelegram,
          rfc,
          user: savedUser,
          department: { id: departmentId },
          coordination: { id: resolvedCoordinationId },
        });
        await manager.save(staff);

        return savedUser.id;
      });

      return savedUserId;
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  /**
   * Actualiza transaccionalmente los datos de la cuenta (User) y del personal (Staff).
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<void> {
    if (updateUserDto.roleId) {
      const coordinatorRoleId = await this.rolesService.findIsCoordinator();

      if (updateUserDto.roleId !== coordinatorRoleId) {
        updateUserDto.coordinationId =
          await this.coordinationsService.findUnCordination();
      }
    }

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

        // Si se provee nueva contraseña, se hashea
        if (toUpdate.password) {
          toUpdate.password = await bcrypt.hash(toUpdate.password, 10);
        }

        // 1. Actualizar cuenta (User)
        manager.merge(User, user, toUpdate);

        if (roleId) {
          user.role = { id: roleId } as Role;
        }
        await manager.save(user);

        // 2. Actualizar expediente de personal (Staff) si existe
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
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  private handleDBExceptions(error: unknown): never {
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
