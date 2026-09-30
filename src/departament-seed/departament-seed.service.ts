import { Injectable, ConflictException } from '@nestjs/common';
import { seed_departament } from './data/departament-seed-data';
import { DepartmentsService } from 'src/departments/departments.service';
import { Department } from 'src/departments/entities/department.entity';

@Injectable()
export class DepartamentSeedService {
  constructor(private readonly departamentService: DepartmentsService) {}

  async runSeed() {
    // Obtenemos los departamentos existentes
    const existingDepartments = await this.departamentService.findAll();

    // Si hay más de 1, asumimos que el seed ya insertó el resto de departamentos
    const hasDepartments = existingDepartments.length > 1;

    if (hasDepartments) {
      throw new ConflictException(
        'El seed de departamentos ya fue ejecutado anteriormente.',
      );
    }

    // Le pasamos los departamentos actuales a la función creadora
    await this.createDepartaments(existingDepartments);
    return { message: 'Seed de departamentos ejecutado correctamente' };
  }

  private async createDepartaments(existingDepartments: Department[]) {
    const departaments = seed_departament;
    const insertPromise: Promise<any>[] = [];

    departaments.forEach((departament) => {
      // Verificamos si el departamento (ej. 'Dirección') ya existe en la BD
      const exists = existingDepartments.some(
        (existing) =>
          existing.name === departament.name ||
          existing.acronym === departament.acronym,
      );

      // Solo lo agregamos a la cola de promesas si NO existe
      if (!exists) {
        insertPromise.push(this.departamentService.create(departament));
      }
    });

    // Ejecutamos todas las inserciones válidas
    if (insertPromise.length > 0) {
      await Promise.all(insertPromise);
    }

    return true;
  }
}
