import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

import { BatchesproductsController } from './batchesproducts.controller';
import { BatchesproductsService } from './batchesproducts.service';
import { CreateBatchesproductDto } from './dto/create-batchesproduct.dto';
import { UserRoleGuard } from 'src/auth/guards/user-role.guard';
import { ConsumableUbication } from 'src/consumables/ubications/entities/consumable_ubication.entity';
import { BrandConsumable } from 'src/consumables/brands/entities/brand-consumable.entity';
import { Typeconsumable } from 'src/consumables/types/entities/typeconsumable.entity';
import { UnitMeasurement } from 'src/consumables/units/entities/unit-measurement.entity';

describe('BatchesproductsController', () => {
  let controller: BatchesproductsController;
  let service: jest.Mocked<BatchesproductsService>;

  // Fixtures de prueba
  const mockCreateBatchesproductDto: CreateBatchesproductDto = {
    num_requirement: 'REQ-2024-001',
    items: [
      {
        id_consumable: 'consumable-uuid-1',
        arrival_amount: 10,
        cost_batch: 500,
      },
    ],
  };

  const mockSuccessResponse: Awaited<
    ReturnType<BatchesproductsService['create']>
  > = {
    message: 'Lotes registrados con éxito mediante bolsa de herramientas',
    code_movement_aplication: 'ENT_16',
    total_processed: 1,
    batches: [
      {
        id: '5a2e81b4-96c2-4d11-8231-1823746de507',
        num_requirement: 'REQ-2024-001',
        arrival_amount: 10,
        quantity_consumable: 20,
        available_stock: 20,
        cost_batch: 500,
        cost_unit: 25,
        created_at: new Date(),
        updated_at: new Date(),
        consumableMovements: [],
        id_consumable: {
          id: 'consumable-uuid-1',
          name: 'Tóner HP',
          item_code: '',
          description: '',
          number_uses: 0,
          imageUrl: '',
          id_ubication_consumable: new ConsumableUbication(),
          id_brand_consumable: new BrandConsumable(),
          id_type_consumable: new Typeconsumable(),
          id_unit_measurement: new UnitMeasurement(),
          batchesproduct: [],
          created_at: new Date(),
          updated_at: new Date(),
        },
      },
    ],
  };

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BatchesproductsController],
      providers: [
        {
          provide: BatchesproductsService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(UserRoleGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<BatchesproductsController>(
      BatchesproductsController,
    );
    service = module.get(BatchesproductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('debe delegar la creación al BatchesproductsService y retornar la respuesta esperada', async () => {
      service.create.mockResolvedValueOnce(mockSuccessResponse);

      const result = await controller.create(mockCreateBatchesproductDto);

      expect(service.create).toHaveBeenCalledTimes(1);
      expect(service.create).toHaveBeenCalledWith(mockCreateBatchesproductDto);
      expect(result).toEqual(mockSuccessResponse);
    });

    it('debe propagar ConflictException si el servicio la lanza (Requerimiento duplicado)', async () => {
      const error = new ConflictException(
        'errors.batchesproducts.requirementAlreadyExists',
      );
      service.create.mockRejectedValueOnce(error);

      await expect(
        controller.create(mockCreateBatchesproductDto),
      ).rejects.toThrow(ConflictException);
      expect(service.create).toHaveBeenCalledWith(mockCreateBatchesproductDto);
    });

    it('debe propagar NotFoundException si un recurso no existe (Ej: Consumible no encontrado)', async () => {
      const error = new NotFoundException(
        'errors.consumables.consumableNotFound',
      );
      service.create.mockRejectedValueOnce(error);

      await expect(
        controller.create(mockCreateBatchesproductDto),
      ).rejects.toThrow(NotFoundException);
      expect(service.create).toHaveBeenCalledWith(mockCreateBatchesproductDto);
    });

    it('debe propagar BadRequestException cuando el servicio falla por clave foránea u otra validación', async () => {
      const error = new BadRequestException(
        'errors.batchesproducts.foreignKeyViolation',
      );
      service.create.mockRejectedValueOnce(error);

      await expect(
        controller.create(mockCreateBatchesproductDto),
      ).rejects.toThrow(BadRequestException);
      expect(service.create).toHaveBeenCalledWith(mockCreateBatchesproductDto);
    });

    it('debe propagar InternalServerErrorException si ocurre un error no controlado en la base de datos', async () => {
      const error = new InternalServerErrorException(
        'errors.internalServerError',
      );
      service.create.mockRejectedValueOnce(error);

      await expect(
        controller.create(mockCreateBatchesproductDto),
      ).rejects.toThrow(InternalServerErrorException);
      expect(service.create).toHaveBeenCalledWith(mockCreateBatchesproductDto);
    });
  });
});
