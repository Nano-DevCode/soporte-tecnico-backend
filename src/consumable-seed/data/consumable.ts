export interface CatalogItem {
  name: string;
  acronym: string;
}
export interface CatalogSimple {
  name: string;
}
export interface SeedData {
  // brands_consumable: CatalogSimple[];
  unit_measurement: CatalogSimple[];
  type_consumable: CatalogSimple[];
  // ubication_consumable: CatalogSimple[];
  type_movement: CatalogSimple[];
  movement_aplication: CatalogItem[];
}

export const SEED_DATA: SeedData = {
  // brands_consumable: [{ name: 'Kingston' }],

  unit_measurement: [{ name: 'Fraccionario' }, { name: 'Unitario' }],

  type_consumable: [
    { name: 'Material de Oficina' },
    { name: 'Material de Limpieza' },
    { name: 'Material para Redes' },
    { name: 'Material para Impresoras' },
    { name: 'Material de Cómputo' },
  ],

  // ubication_consumable: [
  //   { name: 'Cubo costado al SITE' },
  //   { name: 'Parte Superior del Mueble A' },
  //   { name: 'Parte Inferior del Mueble A' },
  // ],

  type_movement: [{ name: 'Entrada' }, { name: 'Salida' }],

  movement_aplication: [
    { name: 'Almacén', acronym: 'ALMACEN' },
    { name: 'Ticket', acronym: 'TICKET' },
    { name: 'Uso Interno', acronym: 'INTERNO' },
    { name: 'Dañado', acronym: 'DAÑADO' },
  ],
};
