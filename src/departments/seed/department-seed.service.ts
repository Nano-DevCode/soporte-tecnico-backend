import { Injectable, ConflictException } from '@nestjs/common';
import { seed_departament } from './data/department-seed.data';
import { DepartmentsService } from '../services/departments.service';
import { Department } from '../entities/department.entity';

@Injectable()
export class DepartmentSeedService {
  constructor(private readonly departmentsService: DepartmentsService) {}

  async runSeed() {
    // Obtenemos los departamentos existentes
    const existingDepartments = await this.departmentsService.findAll();

    // Si hay más de 1, asumimos que el seed ya insertó el resto de departamentos
    const hasDepartments = existingDepartments.length > 1;

    if (hasDepartments) {
      throw new ConflictException(
        'El seed de departamentos ya fue ejecutado anteriormente.',
      );
    }

    // Le pasamos los departamentos actuales a la función creadora
    await this.createDepartments(existingDepartments);
    return { message: 'Seed de departamentos ejecutado correctamente' };
  }

  private async createDepartments(existingDepartments: Department[]) {
    const departments = seed_departament;
    const insertPromise: Promise<unknown>[] = [];

    departments.forEach((department) => {
      // Verificamos si el departamento (ej. 'Dirección') ya existe en la BD
      const exists = existingDepartments.some(
        (existing) =>
          existing.name === department.name ||
          existing.acronym === department.acronym,
      );

      // Solo lo agregamos a la cola de promesas si NO existe
      if (!exists) {
        insertPromise.push(this.departmentsService.create(department));
      }
    });

    // Ejecutamos todas las inserciones válidas
    if (insertPromise.length > 0) {
      await Promise.all(insertPromise);
    }

    return true;
  }
}

