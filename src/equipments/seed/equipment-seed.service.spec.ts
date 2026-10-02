import { Test, TestingModule } from '@nestjs/testing';
import { EquipmentSeedService } from './equipment-seed.service';
import { BrandsService } from '../brands/brands.service';
import { PrintingtypesService } from '../hardware/printers/printing-types/printingtypes.service';
import { PrinterfunctiontypesService } from '../hardware/printers/function-types/printerfunctiontypes.service';
import { EquipmenttypesService } from '../types/equipmenttypes.service';
import { ComputerequipmenttypesService } from '../hardware/computers/types/computerequipmenttypes.service';
import { StoragetypesService } from '../hardware/computers/storage-types/storagetypes.service';
import { OperatingsystemsService } from '../hardware/computers/operating-systems/operatingsystems.service';
import { ComputerprocessorsService } from '../hardware/computers/processors/computerprocessors.service';
import { TypenetworksService } from '../hardware/networks/types/typenetworks.service';

describe('EquipmentSeedService', () => {
  let service: EquipmentSeedService;

  const mockBrandsService = {
    deleteAllBrands: jest.fn(),
    createSeedBrands: jest.fn(),
  };
  const mockPrintingtypesService = {
    deleteAllPrintingtypes: jest.fn(),
    createSeedPrintintypes: jest.fn(),
  };
  const mockPrinterfunctiontypesService = {
    deleteAllPrinterfunctiontypes: jest.fn(),
    createSeedPrinterfunctiontypes: jest.fn(),
  };
  const mockEquipmentsTypesService = {
    deleteAllEquipmentsTypes: jest.fn(),
    createSeedEquipmentsTypes: jest.fn(),
  };
  const mockComputerequipmenttypesService = {
    deleteAllComputerEquipmentTypes: jest.fn(),
    createSeedComputerEquipmentTypes: jest.fn(),
  };
  const mockStoragetypesService = {
    deleteAllStorageTypes: jest.fn(),
    createSeedStorageTypes: jest.fn(),
  };
  const mockOperatingsystemsService = {
    deleteAllOperatingSystems: jest.fn(),
    createSeedOperatingSystems: jest.fn(),
  };
  const mockComputerprocessorsService = {
    deleteAllComputerProcessor: jest.fn(),
    createSeedComputerProcessor: jest.fn(),
  };
  const mockTypenetworksService = {
    deleteAllTypeNetworks: jest.fn(),
    createSeedTypeNetworks: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EquipmentSeedService,
        { provide: BrandsService, useValue: mockBrandsService },
        { provide: PrintingtypesService, useValue: mockPrintingtypesService },
        {
          provide: PrinterfunctiontypesService,
          useValue: mockPrinterfunctiontypesService,
        },
        {
          provide: EquipmenttypesService,
          useValue: mockEquipmentsTypesService,
        },
        {
          provide: ComputerequipmenttypesService,
          useValue: mockComputerequipmenttypesService,
        },
        { provide: StoragetypesService, useValue: mockStoragetypesService },
        {
          provide: OperatingsystemsService,
          useValue: mockOperatingsystemsService,
        },
        {
          provide: ComputerprocessorsService,
          useValue: mockComputerprocessorsService,
        },
        { provide: TypenetworksService, useValue: mockTypenetworksService },
      ],
    }).compile();

    service = module.get<EquipmentSeedService>(EquipmentSeedService);
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('RunSeed debe borrar catalogos anteriores e insertar la semilla', async () => {
    await service.RunSeed();

    expect(mockBrandsService.deleteAllBrands).toHaveBeenCalled();
    expect(mockPrintingtypesService.deleteAllPrintingtypes).toHaveBeenCalled();
    expect(
      mockPrinterfunctiontypesService.deleteAllPrinterfunctiontypes,
    ).toHaveBeenCalled();
    expect(
      mockEquipmentsTypesService.deleteAllEquipmentsTypes,
    ).toHaveBeenCalled();
    expect(
      mockComputerequipmenttypesService.deleteAllComputerEquipmentTypes,
    ).toHaveBeenCalled();
    expect(mockStoragetypesService.deleteAllStorageTypes).toHaveBeenCalled();
    expect(
      mockOperatingsystemsService.deleteAllOperatingSystems,
    ).toHaveBeenCalled();
    expect(
      mockComputerprocessorsService.deleteAllComputerProcessor,
    ).toHaveBeenCalled();
    expect(mockTypenetworksService.deleteAllTypeNetworks).toHaveBeenCalled();

    expect(mockBrandsService.createSeedBrands).toHaveBeenCalled();
    expect(mockPrintingtypesService.createSeedPrintintypes).toHaveBeenCalled();
    expect(
      mockPrinterfunctiontypesService.createSeedPrinterfunctiontypes,
    ).toHaveBeenCalled();
    expect(
      mockEquipmentsTypesService.createSeedEquipmentsTypes,
    ).toHaveBeenCalled();
    expect(
      mockComputerequipmenttypesService.createSeedComputerEquipmentTypes,
    ).toHaveBeenCalled();
    expect(mockStoragetypesService.createSeedStorageTypes).toHaveBeenCalled();
    expect(
      mockOperatingsystemsService.createSeedOperatingSystems,
    ).toHaveBeenCalled();
    expect(
      mockComputerprocessorsService.createSeedComputerProcessor,
    ).toHaveBeenCalled();
    expect(mockTypenetworksService.createSeedTypeNetworks).toHaveBeenCalled();
  });
});
