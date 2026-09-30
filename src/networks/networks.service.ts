import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { Network } from './entities/network.entity';
import { CreateNetworkDto } from './dto/create-network.dto';
import { UpdateNetworkDto } from './dto/update-network.dto';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class NetworksService {
  constructor(
    @InjectRepository(Network) // Inyectar la entidad Network
    private readonly networkRepository: Repository<Network>, // Se crea la propiedad de clase
  ) {}

  async createWithTransaction(
    manager: EntityManager,
    dto: CreateNetworkDto,
    equipmentId: string,
  ) {
    const network = manager.create(Network, {
      id_equipment: { id: equipmentId },
      id_type_equipment_network: { id: dto.id_type_equipment_network },
      number_ports: dto.number_ports,
      PoE: dto.PoE ?? false,
    });
    return await manager.save(network);
  }
  async updateWithTransaction(
    manager: EntityManager,
    networkId: string,
    dto: UpdateNetworkDto,
  ) {
    const { id_type_equipment_network, number_ports, PoE, ...restOfDto } = dto;

    const network = await manager.preload(Network, {
      id: networkId,
      ...restOfDto,
      ...(number_ports !== undefined && { number_ports }),
      ...(PoE !== undefined && { PoE }),

      ...(id_type_equipment_network && {
        id_type_equipment_network: { id: id_type_equipment_network },
      }),
    });

    if (!network) return;

    return await manager.save(network);
  }

  async findOneByEquipment(equipmentId: string, manager?: EntityManager) {
    const repo = manager
      ? manager.getRepository(Network)
      : this.networkRepository;

    const network = await repo.findOne({
      where: { id_equipment: { id: equipmentId } },
      relations: ['id_type_equipment_network'],
    });

    if (!network)
      throw new NotFoundException('Detalles de red no encontrados.');
    return network;
  }
}
