import { Equipment } from 'src/equipments/entities/equipment.entity';

const standardTypesMapper = [
  'computadora',
  'computer',
  'impresora',
  'printer',
  'red',
  'network',
];

export const mapEquipmentToDto = (eq: Equipment, category: string = 'all') => {
  const typeName = eq.id_type_equipment?.name.toLowerCase() || 'desconocido';
  const isSpecialType = !standardTypesMapper.some((t) => typeName.includes(t));
  const targetCategory = category.toLowerCase();

  const base = {
    id: eq.id,
    folio: eq.num_inventario,
    type: eq.id_type_equipment?.name || 'N/A',
    departamento: eq.id_departament?.name || 'Sin departamento',
    model: eq.id_model
      ? `${eq.id_model.id_brand?.name || 'Marca N/A'} - ${eq.id_model.name}`
      : 'Modelo no especificado',
    responsableName: eq.id_responsable
      ? `${eq.id_responsable.name} ${eq.id_responsable.first_name} ${eq.id_responsable.last_name}`
      : 'Sin asignar',
    status: eq.status,
    ...((isSpecialType || targetCategory !== 'all') && {
      description: eq.description || '',
    }),
  };

  if (
    eq.computer &&
    (targetCategory === 'all' ||
      targetCategory === 'computer' ||
      typeName.includes('computer') ||
      typeName.includes('computadora'))
  ) {
    return {
      ...base,
      processor: eq.computer.id_processor
        ? `${eq.computer.id_processor.brand || ''} - ${eq.computer.id_processor.model || ''}`
        : '-',
      ram: eq.computer?.ram || '-',
      storage: eq.computer?.capacity_storage || '-',
      operatingSystem: eq.computer.id_type_operating_system?.name || '-',
      typeEquipmentComputer:
        eq.computer.id_type_equipment_computer?.name ||
        'Accesorio de Computadora',
    };
  }

  if (
    eq.printer &&
    (targetCategory === 'all' ||
      targetCategory === 'printer' ||
      typeName.includes('printer') ||
      typeName.includes('impresora'))
  ) {
    return {
      ...base,
      typefunction: eq.printer.id_type_function?.name || 'N/A',
      typeprinting: eq.printer.id_type_printing?.name || 'N/A',
      color: eq.printer.color,
      modelToner: eq.printer.model_toner,
    };
  }

  if (
    eq.network &&
    (targetCategory === 'all' ||
      targetCategory === 'network' ||
      typeName.includes('network') ||
      typeName.includes('red'))
  ) {
    return {
      ...base,
      typeEquipmentNetwork:
        eq.network.id_type_equipment_network?.name || 'Accesorio de Red',
      numberPorts: eq.network.number_ports || 0,
      PoE: eq.network.PoE ?? false,
    };
  }

  return base;
};
