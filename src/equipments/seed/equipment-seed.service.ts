import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, ILike, Repository } from 'typeorm';

import {
  SEED_DATA,
  SEED_EQUIPMENT_ITEMS,
  SEED_MODELS,
  SEED_RESPONSIBLES,
} from './data/equipment';
import { BrandsService } from '../brands/brands.service';
import { PrinterfunctiontypesService } from '../hardware/printers/function-types/printerfunctiontypes.service';
import { PrintingtypesService } from '../hardware/printers/printing-types/printingtypes.service';
import { EquipmenttypesService } from '../types/equipmenttypes.service';
import { ComputerequipmenttypesService } from '../hardware/computers/types/computerequipmenttypes.service';
import { StoragetypesService } from '../hardware/computers/storage-types/storagetypes.service';
import { OperatingsystemsService } from '../hardware/computers/operating-systems/operatingsystems.service';
import { ComputerprocessorsService } from '../hardware/computers/processors/computerprocessors.service';
import { TypenetworksService } from '../hardware/networks/types/typenetworks.service';
import { DepartmentsService } from 'src/departments/services/departments.service';
import { EquipmentCrudService } from '../services/equipment-crud.service';
import { CreateComputerDto } from '../hardware/computers/dto/create-computer.dto';
import { CreatePrinterDto } from '../hardware/printers/dto/create-printer.dto';
import { CreateNetworkDto } from '../hardware/networks/dto/create-network.dto';

import { Equipment } from '../entities/equipment.entity';
import { Model } from '../models/entities/model.entity';
import { Brand } from '../brands/entities/brand.entity';
import { Responsibleequipment } from '../responsibles/entities/responsibleequipment.entity';
import { Department } from 'src/departments/entities/department.entity';
import { Equipmenttype } from '../types/entities/equipmenttype.entity';
import { Computerequipmenttype } from '../hardware/computers/types/entities/computerequipmenttype.entity';
import { Storagetype } from '../hardware/computers/storage-types/entities/storagetype.entity';
import { Operatingsystem } from '../hardware/computers/operating-systems/entities/operatingsystem.entity';
import { Computerprocessor } from '../hardware/computers/processors/entities/computerprocessor.entity';
import { Printingtype } from '../hardware/printers/printing-types/entities/printingtype.entity';
import { Printerfunctiontype } from '../hardware/printers/function-types/entities/printerfunctiontype.entity';
import { Typenetwork } from '../hardware/networks/types/entities/typenetwork.entity';

@Injectable()
export class EquipmentSeedService {
  private readonly logger = new Logger(EquipmentSeedService.name);

  constructor(
    @InjectRepository(Equipment)
    private readonly equipmentRepository: Repository<Equipment>,
    @InjectRepository(Model)
    private readonly modelRepository: Repository<Model>,
    @InjectRepository(Responsibleequipment)
    private readonly responsibleRepository: Repository<Responsibleequipment>,
    private readonly brandsService: BrandsService,
    private readonly printingTypesService: PrintingtypesService,
    private readonly printerFunctionTypesService: PrinterfunctiontypesService,
    private readonly equipmentsTypesService: EquipmenttypesService,
    private readonly computerEquipmentTypesService: ComputerequipmenttypesService,
    private readonly storageTypesService: StoragetypesService,
    private readonly operatingSystemsService: OperatingsystemsService,
    private readonly computerProcessorsService: ComputerprocessorsService,
    private readonly typenetworksService: TypenetworksService,
    private readonly departmentsService: DepartmentsService,
    private readonly equipmentCrudService: EquipmentCrudService,
    private readonly dataSource: DataSource,
  ) {}

  async RunSeed() {
    const existingCount = await this.equipmentRepository.count();
    if (existingCount > 0) {
      throw new ConflictException(
        'El seed de equipos ya fue ejecutado anteriormente.',
      );
    }

    this.logger.log('Iniciando seed de catálogos de equipamiento...');
    await this.seedCatalogs();

    this.logger.log('Iniciando seed de modelos de hardware...');
    await this.seedModels();

    this.logger.log('Iniciando seed de personal responsable de equipos...');
    await this.seedResponsibles();

    this.logger.log('Iniciando seed de inventario de equipos...');
    await this.seedEquipmentItems();

    this.logger.log('Seed de equipamiento completado exitosamente.');
    return { message: 'Seed de equipos ejecutado correctamente' };
  }

  private async seedCatalogs() {
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

  private async seedModels() {
    const brandRepo = this.dataSource.getRepository(Brand);

    for (const modelSeed of SEED_MODELS) {
      const brand = await brandRepo.findOne({
        where: { name: ILike(modelSeed.brandName.trim()) },
      });
      if (!brand) continue;

      const existingModel = await this.modelRepository.findOne({
        where: {
          name: ILike(modelSeed.name.trim()),
          id_brand: { id: brand.id },
        },
      });

      if (!existingModel) {
        const newModel = this.modelRepository.create({
          name: modelSeed.name.trim(),
          id_brand: brand,
        });
        await this.modelRepository.save(newModel);
      }
    }
  }

  private async seedResponsibles() {
    for (const respSeed of SEED_RESPONSIBLES) {
      const existing = await this.responsibleRepository.findOne({
        where: [
          { num_employe: respSeed.num_employe.trim() },
          { mail: ILike(respSeed.mail.trim().toLowerCase()) },
        ],
      });

      if (!existing) {
        const responsible = this.responsibleRepository.create({
          num_employe: respSeed.num_employe.trim(),
          name: respSeed.name.trim(),
          first_name: respSeed.first_name.trim(),
          last_name: respSeed.last_name.trim(),
          area: respSeed.area.trim(),
          mail: respSeed.mail.trim().toLowerCase(),
        });
        await this.responsibleRepository.save(responsible);
      }
    }
  }

  private async seedEquipmentItems() {
    // 1. Cargar relaciones en memoria para mapeo eficiente
    const [
      models,
      departments,
      responsibles,
      equipmentTypes,
      computerTypes,
      storageTypes,
      operatingSystems,
      processors,
      printingTypes,
      printerFunctionTypes,
      networkTypes,
    ] = await Promise.all([
      this.modelRepository.find({ relations: ['id_brand'] }),
      this.departmentsService.findAll(),
      this.responsibleRepository.find(),
      this.dataSource.getRepository(Equipmenttype).find(),
      this.dataSource.getRepository(Computerequipmenttype).find(),
      this.dataSource.getRepository(Storagetype).find(),
      this.dataSource.getRepository(Operatingsystem).find(),
      this.dataSource.getRepository(Computerprocessor).find(),
      this.dataSource.getRepository(Printingtype).find(),
      this.dataSource.getRepository(Printerfunctiontype).find(),
      this.dataSource.getRepository(Typenetwork).find(),
    ]);

    for (const item of SEED_EQUIPMENT_ITEMS) {
      const existing = await this.equipmentRepository.findOne({
        where: { num_inventario: item.num_inventario.trim() },
      });
      if (existing) continue;

      // Resolver Modelo
      const model = models.find(
        (m) =>
          m?.name?.trim().toLowerCase() === item.modelName.trim().toLowerCase() &&
          m?.id_brand?.name?.trim().toLowerCase() ===
            item.brandName.trim().toLowerCase(),
      );
      if (!model) {
        this.logger.warn(
          `Modelo no encontrado para seed de equipo: ${item.brandName} ${item.modelName}`,
        );
        continue;
      }

      // Resolver Departamento
      const dept =
        departments.find(
          (d) =>
            d?.acronym?.trim().toUpperCase() ===
            item.departmentAcronym.trim().toUpperCase(),
        ) ||
        departments.find((d) =>
          d?.name
            ?.trim()
            .toLowerCase()
            .includes(item.departmentAcronym.trim().toLowerCase()),
        ) ||
        departments[0];

      // Resolver Responsable
      const responsible =
        responsibles.find(
          (r) =>
            r?.mail?.trim().toLowerCase() ===
            item.responsibleEmail.trim().toLowerCase(),
        ) || responsibles[0];

      // Resolver Tipo de Equipo Raíz
      const typeEquipment = equipmentTypes.find(
        (t) =>
          t?.name?.trim().toLowerCase() === item.typeName.trim().toLowerCase(),
      );
      if (!typeEquipment) {
        this.logger.warn(`Tipo de equipo no encontrado: ${item.typeName}`);
        continue;
      }

      // Resolver sub-especificaciones según tipo
      let computerDto: CreateComputerDto | undefined = undefined;
      let printerDto: CreatePrinterDto | undefined = undefined;
      let networkDto: CreateNetworkDto | undefined = undefined;

      if (item.computer) {
        const compType = computerTypes.find(
          (ct) =>
            ct?.name?.trim().toLowerCase() ===
            item.computer!.computerType.trim().toLowerCase(),
        );
        const storageType = storageTypes.find(
          (st) =>
            st?.name?.trim().toLowerCase() ===
            item.computer!.storageType.trim().toLowerCase(),
        );
        const os = operatingSystems.find(
          (o) =>
            o?.name?.trim().toLowerCase() ===
            item.computer!.operatingSystem.trim().toLowerCase(),
        );
        const processor = processors.find(
          (p) =>
            p?.model?.trim().toLowerCase() ===
            item.computer!.processorModel.trim().toLowerCase(),
        );

        if (compType && storageType && os && processor) {
          computerDto = {
            id_type_equipment_computer: compType.id,
            id_type_storage: storageType.id,
            id_type_operating_system: os.id,
            id_processor: processor.id,
            ram: item.computer.ram,
            capacity_storage: item.computer.capacity_storage,
            available_storage: item.computer.available_storage,
          };
        } else {
          this.logger.warn(
            `Faltan especificaciones de computadora para ${item.num_inventario}`,
          );
        }
      } else if (item.printer) {
        const pType = printingTypes.find(
          (pt) =>
            pt?.name?.trim().toLowerCase() ===
            item.printer!.printingType.trim().toLowerCase(),
        );
        const fType = printerFunctionTypes.find(
          (ft) =>
            ft?.name?.trim().toLowerCase() ===
            item.printer!.functionType.trim().toLowerCase(),
        );

        if (pType && fType) {
          printerDto = {
            id_type_printing: pType.id,
            id_type_function: fType.id,
            color: item.printer.color,
            model_toner: item.printer.model_toner,
          };
        } else {
          this.logger.warn(
            `Faltan especificaciones de impresora para ${item.num_inventario}`,
          );
        }
      } else if (item.network) {
        const netType = networkTypes.find(
          (nt) =>
            nt?.name?.trim().toLowerCase() ===
            item.network!.networkType.trim().toLowerCase(),
        );

        if (netType) {
          networkDto = {
            id_type_equipment_network: netType.id,
            number_ports: item.network.number_ports,
            PoE: item.network.PoE,
          };
        } else {
          this.logger.warn(
            `Faltan especificaciones de red para ${item.num_inventario}`,
          );
        }
      }

      await this.equipmentCrudService.create({
        num_inventario: item.num_inventario,
        num_serial: item.num_serial,
        id_model: model.id,
        id_type_equipment: typeEquipment.id,
        id_departament: dept ? dept.id : undefined,
        id_responsable: responsible ? responsible.id : undefined,
        status: true,
        description: item.description,
        computer: computerDto,
        printer: printerDto,
        network: networkDto,
      });
    }
  }
}
