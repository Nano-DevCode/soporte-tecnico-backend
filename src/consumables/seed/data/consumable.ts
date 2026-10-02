export interface CatalogItem {
  name: string;
  acronym: string;
}

export interface CatalogSimple {
  name: string;
}

export interface ConsumableSeedItem {
  name: string;
  description: string;
  brandName: string;
  typeName: string;
  ubicationName: string;
  unitMeasurementName: 'Unitario' | 'Fraccionario';
  number_uses?: number;
  stockMin: number;
  stockMax: number;
  initialStock: number;
  unitCost: number;
}

export interface SeedData {
  brands_consumable: CatalogSimple[];
  unit_measurement: CatalogSimple[];
  type_consumable: CatalogSimple[];
  ubication_consumable: CatalogSimple[];
  type_movement: CatalogSimple[];
  movement_aplication: CatalogItem[];
}

export const SEED_DATA: SeedData = {
  brands_consumable: [
    { name: 'HP' },
    { name: 'Epson' },
    { name: 'Brother' },
    { name: 'Canon' },
    { name: 'Xerox' },
    { name: 'Kingston' },
    { name: 'Adata' },
    { name: 'Logitech' },
    { name: 'Cisco' },
    { name: 'Belden' },
    { name: 'Steren' },
    { name: '3M' },
    { name: 'Silimex' },
    { name: 'APC' },
    { name: 'TP-Link' },
  ],

  unit_measurement: [{ name: 'Fraccionario' }, { name: 'Unitario' }],

  type_consumable: [
    { name: 'Material de Oficina' },
    { name: 'Material de Limpieza' },
    { name: 'Material para Redes' },
    { name: 'Material para Impresoras' },
    { name: 'Material de Cómputo' },
  ],

  ubication_consumable: [
    { name: 'Almacén Central - Anaquel A1' },
    { name: 'Almacén Central - Gaveta B2' },
    { name: 'SITE Principal - Gabinete TI' },
    { name: 'Taller de Soporte - Estante Herramientas' },
    { name: 'Área de Impresión - Mueble Consumibles' },
    { name: 'Bodega de Redes - Rack Accesorios' },
  ],

  type_movement: [{ name: 'Entrada' }, { name: 'Salida' }],

  movement_aplication: [
    { name: 'Almacén', acronym: 'ALMACEN' },
    { name: 'Ticket', acronym: 'TICKET' },
    { name: 'Uso Interno', acronym: 'INTERNO' },
    { name: 'Dañado', acronym: 'DAÑADO' },
  ],
};

export const SEED_CONSUMABLES: ConsumableSeedItem[] = [
  // --- MATERIAL PARA IMPRESORAS ---
  {
    name: 'Tóner HP 58A Negro',
    description: 'Cartucho de tóner HP 58A original para impresoras LaserJet Pro M404 / M428',
    brandName: 'HP',
    typeName: 'Material para Impresoras',
    ubicationName: 'Área de Impresión - Mueble Consumibles',
    unitMeasurementName: 'Unitario',
    stockMin: 3,
    stockMax: 20,
    initialStock: 10,
    unitCost: 1850.0,
  },
  {
    name: 'Tinta Epson 544 Negra',
    description: 'Botella de tinta original Epson 544 T544120 negra de 65 ml para línea EcoTank',
    brandName: 'Epson',
    typeName: 'Material para Impresoras',
    ubicationName: 'Área de Impresión - Mueble Consumibles',
    unitMeasurementName: 'Unitario',
    stockMin: 5,
    stockMax: 30,
    initialStock: 15,
    unitCost: 260.0,
  },
  {
    name: 'Tinta Epson 544 Cyan/Magenta/Yellow Kit',
    description: 'Juego de tintas originales Epson 544 color para impresoras EcoTank L3250 / L3150',
    brandName: 'Epson',
    typeName: 'Material para Impresoras',
    ubicationName: 'Área de Impresión - Mueble Consumibles',
    unitMeasurementName: 'Unitario',
    stockMin: 4,
    stockMax: 25,
    initialStock: 12,
    unitCost: 780.0,
  },
  {
    name: 'Tóner Brother TN-660 Negro',
    description: 'Tóner de alto rendimiento Brother TN-660 para DCP-L2540DW / HL-L2360DW',
    brandName: 'Brother',
    typeName: 'Material para Impresoras',
    ubicationName: 'Área de Impresión - Mueble Consumibles',
    unitMeasurementName: 'Unitario',
    stockMin: 2,
    stockMax: 15,
    initialStock: 8,
    unitCost: 1100.0,
  },

  // --- MATERIAL PARA REDES ---
  {
    name: 'Bobina Cable UTP Cat6 305m',
    description: 'Bobina de cable de red par trenzado Belden Cat6 100% cobre para cableado estructurado',
    brandName: 'Belden',
    typeName: 'Material para Redes',
    ubicationName: 'Bodega de Redes - Rack Accesorios',
    unitMeasurementName: 'Fraccionario',
    number_uses: 305, // Se mide por metro
    stockMin: 50,
    stockMax: 1525,
    initialStock: 610, // 2 bobinas
    unitCost: 12.5,
  },
  {
    name: 'Conectores RJ45 Cat6 Caja 100pz',
    description: 'Caja con 100 piezas de conectores RJ45 macho para cable categoría 6 con contactos dorados',
    brandName: 'Steren',
    typeName: 'Material para Redes',
    ubicationName: 'Bodega de Redes - Rack Accesorios',
    unitMeasurementName: 'Fraccionario',
    number_uses: 100, // Se descuentan por unidad de conector
    stockMin: 50,
    stockMax: 500,
    initialStock: 300,
    unitCost: 4.5,
  },
  {
    name: 'Patch Cord UTP Cat6 2 metros Azul',
    description: 'Cable de parcheo premoldeado Cat6 RJ45 de 2 metros para conexiones a paneles y equipos',
    brandName: 'Steren',
    typeName: 'Material para Redes',
    ubicationName: 'Bodega de Redes - Rack Accesorios',
    unitMeasurementName: 'Unitario',
    stockMin: 10,
    stockMax: 60,
    initialStock: 35,
    unitCost: 65.0,
  },
  {
    name: 'Patch Cord Fibra Óptica LC-LC Dúplex 3m',
    description: 'Jumper de fibra óptica multimodo OM3 LC a LC dúplex 50/125 para interconexión de switches',
    brandName: 'Cisco',
    typeName: 'Material para Redes',
    ubicationName: 'SITE Principal - Gabinete TI',
    unitMeasurementName: 'Unitario',
    stockMin: 2,
    stockMax: 15,
    initialStock: 6,
    unitCost: 320.0,
  },

  // --- MATERIAL DE LIMPIEZA Y MANTENIMIENTO ---
  {
    name: 'Alcohol Isopropílico 1 Litro',
    description: 'Alcohol isopropílico al 99.8% Silimex Silijet para limpieza de componentes electrónicos y tarjetas',
    brandName: 'Silimex',
    typeName: 'Material de Limpieza',
    ubicationName: 'Taller de Soporte - Estante Herramientas',
    unitMeasurementName: 'Fraccionario',
    number_uses: 25, // Aproximadamente 25 aplicaciones de mantenimiento
    stockMin: 5,
    stockMax: 30,
    initialStock: 15,
    unitCost: 145.0,
  },
  {
    name: 'Aire Comprimido Removedor de Polvo 400ml',
    description: 'Lata de aire comprimido Aerojet para remover polvo y suciedad en teclados y gabinetes',
    brandName: 'Silimex',
    typeName: 'Material de Limpieza',
    ubicationName: 'Taller de Soporte - Estante Herramientas',
    unitMeasurementName: 'Fraccionario',
    number_uses: 12, // Aproximadamente 12 sopleteados de equipo
    stockMin: 6,
    stockMax: 40,
    initialStock: 24,
    unitCost: 95.0,
  },
  {
    name: 'Espuma Limpiadora para Superficies y Plásticos',
    description: 'Espuma limpiadora antiestática para carcasas de computadoras, monitores e impresoras',
    brandName: 'Silimex',
    typeName: 'Material de Limpieza',
    ubicationName: 'Taller de Soporte - Estante Herramientas',
    unitMeasurementName: 'Fraccionario',
    number_uses: 30,
    stockMin: 4,
    stockMax: 20,
    initialStock: 12,
    unitCost: 110.0,
  },
  {
    name: 'Pasta Térmica de Alto Rendimiento 4g',
    description: 'Jeringa de compuesto térmico de micropartículas de carbono para disipadores de CPU',
    brandName: '3M',
    typeName: 'Material de Limpieza',
    ubicationName: 'Taller de Soporte - Estante Herramientas',
    unitMeasurementName: 'Fraccionario',
    number_uses: 8, // 8 aplicaciones en procesadores
    stockMin: 3,
    stockMax: 15,
    initialStock: 8,
    unitCost: 190.0,
  },

  // --- MATERIAL DE CÓMPUTO ---
  {
    name: 'Memoria RAM Kingston Fury 8GB DDR4 3200MHz',
    description: 'Módulo de memoria RAM Kingston Fury Beast DDR4 de 8GB CL16 para actualización de desktops',
    brandName: 'Kingston',
    typeName: 'Material de Cómputo',
    ubicationName: 'Almacén Central - Gaveta B2',
    unitMeasurementName: 'Unitario',
    stockMin: 4,
    stockMax: 25,
    initialStock: 14,
    unitCost: 480.0,
  },
  {
    name: 'Memoria RAM Kingston Fury 16GB DDR4 3200MHz',
    description: 'Módulo de memoria RAM DDR4 Kingston Fury Beast de 16GB para equipos de diseño y desarrollo',
    brandName: 'Kingston',
    typeName: 'Material de Cómputo',
    ubicationName: 'Almacén Central - Gaveta B2',
    unitMeasurementName: 'Unitario',
    stockMin: 3,
    stockMax: 20,
    initialStock: 10,
    unitCost: 890.0,
  },
  {
    name: 'Disco SSD Kingston NV2 500GB NVMe PCIe 4.0',
    description: 'Unidad de estado sólido M.2 NVMe PCIe 4.0 con velocidades de hasta 3500 MB/s',
    brandName: 'Kingston',
    typeName: 'Material de Cómputo',
    ubicationName: 'Almacén Central - Gaveta B2',
    unitMeasurementName: 'Unitario',
    stockMin: 4,
    stockMax: 20,
    initialStock: 12,
    unitCost: 720.0,
  },
  {
    name: 'Disco SSD Kingston A400 480GB SATA 2.5"',
    description: 'Unidad de estado sólido SATA III de 2.5 pulgadas para reemplazo de discos mecánicos',
    brandName: 'Kingston',
    typeName: 'Material de Cómputo',
    ubicationName: 'Almacén Central - Gaveta B2',
    unitMeasurementName: 'Unitario',
    stockMin: 4,
    stockMax: 25,
    initialStock: 15,
    unitCost: 610.0,
  },
  {
    name: 'Kit Teclado y Mouse Logitech MK120 USB',
    description: 'Combo alámbrico de teclado resistente a salpicaduras y mouse óptico USB en español',
    brandName: 'Logitech',
    typeName: 'Material de Cómputo',
    ubicationName: 'Almacén Central - Anaquel A1',
    unitMeasurementName: 'Unitario',
    stockMin: 5,
    stockMax: 30,
    initialStock: 20,
    unitCost: 340.0,
  },

  // --- MATERIAL DE OFICINA ---
  {
    name: 'Etiquetas Térmicas Autoadheribles 50x25mm Rollo',
    description: 'Rollo de 1,000 etiquetas térmicas autoadheribles para rotulación de inventario de equipos',
    brandName: '3M',
    typeName: 'Material de Oficina',
    ubicationName: 'Almacén Central - Anaquel A1',
    unitMeasurementName: 'Fraccionario',
    number_uses: 1000,
    stockMin: 500,
    stockMax: 5000,
    initialStock: 2000, // 2 rollos
    unitCost: 0.18,
  },
];

