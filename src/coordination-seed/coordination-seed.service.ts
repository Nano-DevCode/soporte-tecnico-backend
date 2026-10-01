import {
  Injectable,
  Logger,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CoordinationsService } from 'src/coordinations/coordinations.service';
import { coordination_seed } from './data/coordination-seed.data';

@Injectable()
export class CoordinationSeedService {
  // Ajustamos el nombre del Logger para que coincida con esta clase
  private readonly logger = new Logger(CoordinationSeedService.name);

  constructor(private readonly coordinationsService: CoordinationsService) {}

  async runSeed() {
    const existingCoordinations = await this.coordinationsService.findAll();

    const hasCoordinations = Array.isArray(existingCoordinations)
      ? existingCoordinations.length > 1
      : existingCoordinations > 1;

    if (hasCoordinations) {
      throw new ConflictException(
        'El seed de coordinaciones ya fue ejecutado anteriormente.',
      );
    }

    await this.coordinationSeed();
    return { message: 'Seed de coordinaciones ejecutado correctamente' };
  }

  private async coordinationSeed() {
    const coordinations = coordination_seed;
    const insertPromise: Promise<unknown>[] = [];

    coordinations.forEach((coordination) => {
      insertPromise.push(this.coordinationsService.create(coordination));
    });

    // Ejecutamos las promesas dentro de un try-catch para capturar fallos
    try {
      await Promise.all(insertPromise);
      return true;
    } catch (error) {
      this.logger.error(`Error insertando coordinaciones en el seed: ${error}`);
      throw new BadRequestException(
        'Ocurrió un error al insertar las coordinaciones. Verifica que no haya datos inválidos o duplicados.',
      );
    }
  }
}
