import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { Role } from './entities/role.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { I18nService } from 'nestjs-i18n';

interface DatabaseError extends Error {
  code?: string;
  detail?: string;
}

@Injectable()
export class RolesService {
  private readonly logger = new Logger('RolesService');
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    private readonly i18n: I18nService,
  ) {}

  async create(createRoleDto: CreateRoleDto) {
    try {
      const role = this.rolesRepository.create(createRoleDto);
      return await this.rolesRepository.save(role);
    } catch (error) {
      this.logger.error(error);
      this.handleDBExeptions(error);
    }
  }

  async findAll() {
    return await this.rolesRepository.find({
      where: {
        name: Not(In(['SuperAdmin', 'Admin'])),
      },
      order: {
        name: 'ASC',
      },
    });
  }

  async findAll2() {
    return await this.rolesRepository.find();
  }

  async findIsCoordinator() {
    const coordination = await this.rolesRepository.findOne({
      where: {
        name: 'Coordinador',
      },
    });
    if (!coordination) {
      throw new NotFoundException(
        this.i18n.t('errors.roles.coordinatorNotFound'),
      );
    }
    return coordination?.id;
  }

  async findOne(id: string) {
    const role = await this.rolesRepository.findOneBy({ id });
    if (!role) {
      throw new NotFoundException(
        this.i18n.t('errors.roles.roleNotFound', { args: { id } }),
      );
    }
    return role;
  }

  private handleDBExeptions(error: unknown) {
    const dbError = error as DatabaseError;
    if (dbError.code === '23505') {
      throw new BadRequestException(dbError.detail);
    }

    this.logger.error(error);
    throw new InternalServerErrorException(
      this.i18n.t('errors.internalServerError'),
    );
  }

  async deleteAllRoles() {
    try {
      await this.rolesRepository.deleteAll();
      return { deleted: true };
    } catch (error) {
      this.handleDBExeptions(error);
    }
  }
}
