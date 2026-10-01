import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { CoordinationsService } from 'src/coordinations/services/coordinations.service';
import { DepartmentsService } from 'src/departments/services/departments.service';
import { RolesService } from 'src/auth/roles/services/roles.service';
import { UsersService } from '../services/users.service';
import { USER_SEED_DATA } from './data/user-seed.data';
import { StaffService } from '../services/staff.service';

@Injectable()
export class UserSeedService {
  constructor(
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService,
    private readonly departmentsService: DepartmentsService,
    private readonly coordinationsService: CoordinationsService,
    private readonly staffService: StaffService,
  ) {}

  async runSeed() {
    // Obtenemos la respuesta paginada
    const existingUsers = await this.usersService.findAll({});
    // Accedemos directamente a la propiedad total de los metadatos
    const hasUsers = existingUsers.meta.total > 1;

    if (hasUsers) {
      throw new ConflictException(
        'El seed de usuarios ya fue ejecutado anteriormente.',
      );
    }

    await this.createUsers();
    return { message: 'Seed de usuarios ejecutado correctamente' };
  }

  private async createUsers() {
    const [roles, departments, coordinations] = await Promise.all([
      this.rolesService.findAll2(),
      this.departmentsService.findAll(),
      this.coordinationsService.findAll(),
    ]);

    const defaultCoord = coordinations.find(
      (c) => c.name === 'Sin Coordinación',
    );

    if (!defaultCoord) {
      throw new BadRequestException(
        'No existe la coordinación "Sin Coordinación"',
      );
    }

    for (const userData of USER_SEED_DATA) {
      const role = roles.find((r) => r.name === userData.roleName);
      const dept = departments.find((d) => d.name === userData.deptName);

      if (!role) {
        throw new BadRequestException(
          `Role no encontrado: ${userData.roleName}`,
        );
      }

      if (!dept) {
        throw new BadRequestException(
          `Departamento no encontrado: ${userData.deptName}`,
        );
      }

      const coordination = userData.coordName
        ? coordinations.find((c) => c.name === userData.coordName)
        : defaultCoord;

      await this.usersService.create({
        email: userData.email,
        password: userData.password,
        name: userData.name,
        rfc: userData.rfc,
        paternalSurname: userData.paternalSurname,
        maternalSurname: userData.maternalSurname,
        idTelegram: userData.idTelegram ?? undefined,
        num_control: userData.num_control,
        roleId: role.id,
        departmentId: dept.id,
        coordinationId: coordination?.id ?? defaultCoord.id,
      });
    }

    return true;
  }
}
