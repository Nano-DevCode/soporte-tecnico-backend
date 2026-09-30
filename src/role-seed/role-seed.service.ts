import {
  Injectable,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { RolesService } from 'src/roles/roles.service';
import { seed_role } from './data/role-seed.data';

@Injectable()
export class RoleSeedService {
  // Instanciamos el logger para poder ver el error real en la consola de NestJS
  private readonly logger = new Logger(RoleSeedService.name);

  constructor(private readonly rolesService: RolesService) {}

  async runSeed() {
    // 1. Verificamos si ya existen roles (si no pasas DTO a findAll, déjalo vacío o ajusta a tu lógica)
    const existingRoles = await this.rolesService.findAll();

    // Soportamos tanto si findAll devuelve un arreglo directo o un objeto paginado
    const hasRoles = Array.isArray(existingRoles)
      ? existingRoles.length > 1
      : existingRoles > 1;

    if (hasRoles) {
      throw new ConflictException(
        'El seed de roles ya fue ejecutado anteriormente.',
      );
    }

    await this.createRoles();
    return { message: 'Seed de roles ejecutado correctamente' };
  }

  private async createRoles() {
    // 2. Eliminamos deleteAllRoles() para evitar errores de llave foránea con usuarios existentes

    const roles = seed_role;
    const insertPromise: Promise<any>[] = [];

    roles.forEach((role) => {
      insertPromise.push(this.rolesService.create(role));
    });

    // 3. Manejamos el Promise.all con un try-catch
    try {
      await Promise.all(insertPromise);
      return true;
    } catch (error) {
      // Registramos el error real en la consola del servidor para debugear
      this.logger.error(
        `Error insertando roles en el seed: ${error as string}`,
      );

      // Le devolvemos al cliente un error 400 manejable en lugar de un 500
      throw new BadRequestException(
        'Ocurrió un error al insertar los roles. Verifica que no haya datos duplicados o inválidos en el seed.',
      );
    }
  }
}
