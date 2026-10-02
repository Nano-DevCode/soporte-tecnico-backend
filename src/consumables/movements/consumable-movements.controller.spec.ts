import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConsumableMovementsController } from './consumable-movements.controller';
import { ConsumableMovementsService } from './consumable-movements.service';
import { CreateConsumableMovementDto } from './dto/create-consumable-movement.dto';
import { I18nService } from 'nestjs-i18n/dist/services/i18n.service';

describe('ConsumableMovementsController', () => {
  let controller: ConsumableMovementsController;
  let service: jest.Mocked<ConsumableMovementsService>;

  const mockResponseSuccess = {
    message: 'Lógica de Salida de consumibles fue aplicada con éxito',
    code_movement_aplication: 'SAL_6',
    total_items_processed: 1,
    records_affected: 2,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConsumableMovementsController],
      providers: [
        {
          provide: ConsumableMovementsService,
          useValue: {
            registerOutput: jest.fn(),
          },
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn().mockImplementation((key: string) => key),
          },
        },
      ],
    }).compile();

    controller = module.get<ConsumableMovementsController>(
      ConsumableMovementsController,
    );
    service = module.get(ConsumableMovementsService);
  });

  it('debe estar definido el controlador', () => {
    expect(controller).toBeDefined();
  });

  describe('registerOutput / create', () => {
    it('debe llamar al servicio registerOutput con el DTO recibido y devolver el resultado', async () => {
      const dto: CreateConsumableMovementDto = {
        id_movement_aplication: 1,
        id_departament_consumable: 'dep-uuid-1',
        observations: 'Salida de insumos para bodega',
        items: [{ id_consumable: 'c-uuid-1', quantity_consumable: 5 }],
      };

      service.registerOutput.mockResolvedValue(mockResponseSuccess);

      // Si el nombre de tu método en el controlador es registerOutput o create:
      const result = await controller.registerOutput(dto);

      expect(service.registerOutput).toHaveBeenCalledWith(dto);
      expect(service.registerOutput).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponseSuccess);
    });

    it('debe propagar la excepción BadRequestException si el servicio la arroja', async () => {
      const dto: CreateConsumableMovementDto = {
        id_movement_aplication: 1,
        id_departament_consumable: 'dep-uuid-1',
        observations: '',
        items: [],
      };

      service.registerOutput.mockRejectedValue(
        new BadRequestException('El carrito de insumos no puede estar vacío'),
      );

      await expect(controller.registerOutput(dto)).rejects.toThrow(
        BadRequestException,
      );
      expect(service.registerOutput).toHaveBeenCalledWith(dto);
    });

    it('debe propagar NotFoundException si el ticket asignado no existe', async () => {
      const dto: CreateConsumableMovementDto = {
        id_movement_aplication: 2,
        id_ticket: 'ticket-inexistente',
        id_departament_consumable: 'dep-uuid-1',
        items: [{ id_consumable: 'c-uuid-1', quantity_consumable: 2 }],
      };

      service.registerOutput.mockRejectedValue(
        new NotFoundException('El ticket especificado no existe'),
      );

      await expect(controller.registerOutput(dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(service.registerOutput).toHaveBeenCalledWith(dto);
    });
  });
});
