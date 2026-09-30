import { Injectable } from '@nestjs/common';
import { SEED_DATA } from './data/equipment';
import { BrandsService } from '../brands/brands.service';
import { PrinterfunctiontypesService } from 'src/printerfunctiontypes/printerfunctiontypes.service';
import { PrintingtypesService } from '../printingtypes/printingtypes.service';
import { EquipmenttypesService } from 'src/equipmenttypes/equipmenttypes.service';
import { ComputerequipmenttypesService } from 'src/computerequipmenttypes/computerequipmenttypes.service';
import { StoragetypesService } from 'src/storagetypes/storagetypes.service';
import { OperatingsystemsService } from '../operatingsystems/operatingsystems.service';
import { ComputerprocessorsService } from 'src/computerprocessors/computerprocessors.service';
import { TypenetworksService } from 'src/typenetworks/typenetworks.service';

@Injectable()
export class EquipmentSeedService {
  constructor(
    private readonly brandsService: BrandsService,
    private readonly printingTypesService: PrintingtypesService,
    private readonly printerFunctionTypesService: PrinterfunctiontypesService,
    private readonly equipmentsTypesService: EquipmenttypesService,
    private readonly computerEquipmentTypesService: ComputerequipmenttypesService,
    private readonly storageTypesService: StoragetypesService,
    private readonly operatingSystemsService: OperatingsystemsService,
    private readonly computerProcessorsService: ComputerprocessorsService,
    private readonly typenetworksService: TypenetworksService,
  ) {}

  async RunSeed() {
    await this.brandsService.deleteAllBrands();
    await this.printingTypesService.deleteAllPrintingtypes();
    await this.printerFunctionTypesService.deleteAllPrinterfunctiontypes();
    await this.equipmentsTypesService.deleteAllEquipmentsTypes();
    await this.computerEquipmentTypesService.deleteAllComputerEquipmentTypes();
    await this.storageTypesService.deleteAllStorageTypes();
    await this.operatingSystemsService.deleteAllOperatingSystems();
    await this.computerProcessorsService.deleteAllComputerProcessor();
    await this.typenetworksService.deleteAllTypeNetworks();

    for (const brand of SEED_DATA.brands) {
      await this.brandsService.createSeedBrands(brand);
    }
    for (const printingType of SEED_DATA.printingTypes) {
      await this.printingTypesService.createSeedPrintintypes(printingType);
    }
    for (const printerFunctionType of SEED_DATA.printerFunctionTypes) {
      await this.printerFunctionTypesService.createSeedPrinterfunctiontypes(
        printerFunctionType,
      );
    }
    for (const equipmentType of SEED_DATA.equipmentTypes) {
      await this.equipmentsTypesService.createSeedEquipmentsTypes(
        equipmentType,
      );
    }
    for (const computerEquipmentType of SEED_DATA.computerEquipmentTypes) {
      await this.computerEquipmentTypesService.createSeedComputerEquipmentTypes(
        computerEquipmentType,
      );
    }
    for (const storageType of SEED_DATA.storageTypes) {
      await this.storageTypesService.createSeedStorageTypes(storageType);
    }
    for (const operatingSystem of SEED_DATA.operatingSystems) {
      await this.operatingSystemsService.createSeedOperatingSystems(
        operatingSystem,
      );
    }
    for (const computerProcessor of SEED_DATA.computerProcessors) {
      await this.computerProcessorsService.createSeedComputerProcessor(
        computerProcessor,
      );
    }
    for (const typeNetworks of SEED_DATA.typeNetworks) {
      await this.typenetworksService.createSeedTypeNetworks(typeNetworks);
    }
  }
}
