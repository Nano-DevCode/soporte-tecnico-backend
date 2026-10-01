import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { I18nService } from 'nestjs-i18n';

import { User } from '../entities/user.entity';
import { GmailService } from 'src/gmail/services/gmail.service';
import { generateTempPassword } from '../util/generateTempPassword.util';
import { notificationChangedPasswordContent } from '../templates/notification-changed-password';
import { notificationRecuperatePasswordTemplate } from '../templates/notification-recuperate-password.template';
import { DatabaseError } from 'src/interfaces/DatabaseError';
import { ChangeUserStatusDto } from '../dto/account/change-status.dto';
import { ChangePasswordUserDto } from '../dto/account/change-password-user.dto';
import { RecuperatePasswordUserDto } from '../dto/account/recuperate-password-user.dto';

/**
 * Servicio de dominio responsable exclusivamente de la gestión de la cuenta de usuario (User):
 * - Ciclo de vida de contraseñas (cambio voluntario y recuperación por correo)
 * - Estado de activación de la cuenta (activo/inactivo)
 * - Preferencias granulares de notificaciones
 */
@Injectable()
export class UserAccountService {
  private readonly logger = new Logger(UserAccountService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly gmailBotService: GmailService,
    private readonly i18n: I18nService,
  ) {}

  /**
   * Cambia el estado activo/inactivo de la cuenta de un usuario.
   */
  async changeStatus(
    id: string,
    changeStatusDto: ChangeUserStatusDto,
  ): Promise<{ id: string; status: boolean }> {
    const result = await this.usersRepository.update(id, {
      status: changeStatusDto.status,
    });

    if (result.affected === 0) {
      throw new NotFoundException(
        this.i18n.t('errors.users.userNotFound', {
          args: { id },
        }),
      );
    }

    return { id, ...changeStatusDto };
  }

  /**
   * Cambia la contraseña del usuario actualmente autenticado y envía un correo de confirmación.
   */
  async passwordChange(
    changePasswordUser: ChangePasswordUserDto,
    user: User,
  ): Promise<{ message: string }> {
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

    const staffName = foundUser.staff?.name ?? '';
    const staffPaternal = foundUser.staff?.paternalSurname ?? '';
    const staffMaternal = foundUser.staff?.maternalSurname ?? '';

    await this.gmailBotService.sendEmail(
      foundUser.email,
      'Cambio de Contraseña - Soporte Técnico',
      notificationChangedPasswordContent(
        staffName,
        staffPaternal,
        staffMaternal,
      ),
    );

    return { message: this.i18n.t('events.users.passwordUpdated') };
  }

  /**
   * Genera una contraseña temporal aleatoria y la envía al correo del usuario.
   */
  async recuperatePassword(
    recuperatePasswordUser: RecuperatePasswordUserDto,
    existingUser?: User,
  ): Promise<{ message: string; email: string }> {
    const { email } = recuperatePasswordUser;

    const user =
      existingUser ??
      (await this.usersRepository.findOne({
        where: { email, status: true },
        relations: { role: true, staff: { department: true } },
      }));

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

      const staffName = user.staff?.name ?? '';
      const staffPaternal = user.staff?.paternalSurname ?? '';
      const staffMaternal = user.staff?.maternalSurname ?? '';

      await this.gmailBotService.sendEmail(
        email,
        'Recuperación de Contraseña - Soporte Técnico',
        notificationRecuperatePasswordTemplate(
          staffName,
          staffPaternal,
          staffMaternal,
          tempPassword,
        ),
      );

      return {
        message: this.i18n.t('events.users.instructionsSent'),
        email,
      };
    } catch (error) {
      this.handleDBExceptions(error);
    }
  }

  /**
   * Obtiene las preferencias granulares de notificación de la cuenta.
   */
  async getPreferences(userId: string): Promise<Record<string, boolean>> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['id', 'notificationPreferences'],
    });

    if (!user) {
      throw new NotFoundException(
        this.i18n.t('errors.users.userNotFound', {
          args: { id: userId },
        }),
      );
    }

    return user.notificationPreferences || {};
  }

  /**
   * Actualiza las preferencias granulares de notificación de la cuenta.
   */
  async updatePreferences(
    userId: string,
    preferences: Record<string, boolean>,
  ): Promise<Record<string, boolean>> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['id', 'notificationPreferences'],
    });

    if (!user) {
      throw new NotFoundException(
        this.i18n.t('errors.users.userNotFound', {
          args: { id: userId },
        }),
      );
    }

    const currentPreferences = user.notificationPreferences || {};
    user.notificationPreferences = { ...currentPreferences, ...preferences };

    await this.usersRepository.save(user);

    return user.notificationPreferences;
  }

  private handleDBExceptions(error: unknown): never {
    const dbError = error as DatabaseError;
    if (dbError.code === '23505') {
      if (dbError.detail?.includes('(email)=')) {
        throw new ConflictException(
          this.i18n.t('errors.users.emailAlreadyInUse'),
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
