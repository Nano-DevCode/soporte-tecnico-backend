import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { Repository, UpdateResult } from 'typeorm';
import { I18nService } from 'nestjs-i18n';
import * as bcrypt from 'bcrypt';

import { UserAccountService } from './user-account.service';
import { User } from '../entities/user.entity';
import { GmailBotService } from 'src/gmail-bot/gmail-bot.service';
import { ChangeUserStatusDto } from '../dto/account/change-status.dto';
import { ChangePasswordUserDto } from '../dto/account/change-password-user.dto';
import { RecuperatePasswordUserDto } from '../dto/account/recuperate-password-user.dto';

jest.mock('bcrypt');

describe('UserAccountService', () => {
  let service: UserAccountService;
  let usersRepository: jest.Mocked<Repository<User>>;
  let gmailBotService: jest.Mocked<GmailBotService>;

  const mockUser: User = {
    id: 'user-uuid-1',
    email: 'test@example.com',
    password: 'hashed_password',
    avatar: 'https://avatar.png',
    status: true,
    notificationPreferences: { TICKET_CREATED: true },
    createdAt: new Date(),
    updatedAt: new Date(),
    role: { id: 'role-1', name: 'admin' } as never,
    staff: {
      id: 'staff-1',
      name: 'Test',
      paternalSurname: 'User',
      maternalSurname: 'One',
    } as never,
    checkFieldsBeforeInsert: jest.fn(),
    checkFieldsBeforeUpdate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserAccountService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            update: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: GmailBotService,
          useValue: {
            sendEmail: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn((key: string) => key),
          },
        },
      ],
    }).compile();

    service = module.get<UserAccountService>(UserAccountService);
    usersRepository = module.get(getRepositoryToken(User));
    gmailBotService = module.get(GmailBotService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('changeStatus', () => {
    it('debe actualizar el estado del usuario', async () => {
      const updateResult: UpdateResult = {
        raw: [],
        affected: 1,
        generatedMaps: [],
      };
      usersRepository.update.mockResolvedValue(updateResult);

      const dto: ChangeUserStatusDto = { status: false };
      const result = await service.changeStatus('user-uuid-1', dto);

      expect(usersRepository.update).toHaveBeenCalledWith('user-uuid-1', {
        status: false,
      });
      expect(result).toEqual({ id: 'user-uuid-1', status: false });
    });

    it('debe lanzar NotFoundException si no se encuentra el usuario', async () => {
      const updateResult: UpdateResult = {
        raw: [],
        affected: 0,
        generatedMaps: [],
      };
      usersRepository.update.mockResolvedValue(updateResult);

      await expect(
        service.changeStatus('user-uuid-1', { status: false }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('passwordChange', () => {
    it('debe cambiar la contraseña y enviar correo', async () => {
      usersRepository.findOne.mockResolvedValue(mockUser);
      usersRepository.update.mockResolvedValue({ affected: 1 } as UpdateResult);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new_hash');

      const dto: ChangePasswordUserDto = { password: 'NewPassword123!' };
      const result = await service.passwordChange(dto, mockUser);

      expect(usersRepository.update).toHaveBeenCalledWith('user-uuid-1', {
        password: 'new_hash',
      });
      expect(gmailBotService.sendEmail).toHaveBeenCalled();
      expect(result).toHaveProperty('message');
    });

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(
        service.passwordChange({ password: 'NewPassword123!' }, mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('recuperatePassword', () => {
    it('debe generar clave temporal y enviar correo', async () => {
      usersRepository.update.mockResolvedValue({ affected: 1 } as UpdateResult);
      (bcrypt.hash as jest.Mock).mockResolvedValue('temp_hash');

      const dto: RecuperatePasswordUserDto = { email: 'test@example.com' };
      const result = await service.recuperatePassword(dto, mockUser);

      expect(usersRepository.update).toHaveBeenCalled();
      expect(gmailBotService.sendEmail).toHaveBeenCalled();
      expect(result).toEqual({
        message: 'events.users.instructionsSent',
        email: 'test@example.com',
      });
    });
  });

  describe('getPreferences & updatePreferences', () => {
    it('debe obtener preferencias del usuario', async () => {
      usersRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.getPreferences('user-uuid-1');
      expect(result).toEqual({ TICKET_CREATED: true });
    });

    it('debe actualizar preferencias del usuario', async () => {
      usersRepository.findOne.mockResolvedValue(mockUser);
      usersRepository.save.mockResolvedValue({
        ...mockUser,
        notificationPreferences: {
          TICKET_CREATED: true,
          TICKET_ASSIGNED: false,
        },
      });

      const result = await service.updatePreferences('user-uuid-1', {
        TICKET_ASSIGNED: false,
      });
      expect(result).toEqual({
        TICKET_CREATED: true,
        TICKET_ASSIGNED: false,
      });
    });
  });
});
