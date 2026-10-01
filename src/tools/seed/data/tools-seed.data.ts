export interface SeedToolModel {
  name: string;
  brandName: string;
}

export interface SeedToolItem {
  name: string;
  idInventary: string;
  description: string;
  modelName: string;
  typeName: string;
  statusName: string;
  invoiceInternal?: string;
  observations?: string;
}

export const TOOLS_BRANDS: string[] = [
  'DEWALT',
  'BOSCH',
  'MAKITA',
  'STANLEY',
  'TRUPER',
  'MILWAUKEE',
  'BLACK+DECKER',
  'FLUKE',
  'KLEIN TOOLS',
  'CRAFTSMAN',
];

export const TOOLS_TYPES: string[] = [
  'HERRAMIENTA MANUAL',
  'HERRAMIENTA ELÉCTRICA',
  'EQUIPO DE MEDICIÓN',
  'HERRAMIENTA DE CORTE',
  'SOLDADURA Y CALOR',
  'REDES Y TELECOMUNICACIONES',
  'SEGURIDAD Y PROTECCIÓN',
];

export const TOOLS_INVOICES: string[] = [
  'FAC-HER-2025-001',
  'FAC-HER-2025-002',
  'FAC-HER-2026-001',
];

export const TOOLS_MODELS: SeedToolModel[] = [
  { name: 'DCD771C2 Taladro Percutor', brandName: 'DEWALT' },
  { name: 'DWE402 Esmeriladora Angular', brandName: 'DEWALT' },
  { name: 'DCF887B Atornillador Impacto', brandName: 'DEWALT' },
  { name: 'GSB 13 RE Percutor Profesional', brandName: 'BOSCH' },
  { name: 'GWS 700 Mini Esmeriladora', brandName: 'BOSCH' },
  { name: 'GLM 50 C Medidor Láser', brandName: 'BOSCH' },
  { name: 'HP333D Rotomartillo Inalámbrico', brandName: 'MAKITA' },
  { name: 'GA4530 Esmeriladora 4-1/2"', brandName: 'MAKITA' },
  { name: 'DJR186Z Sierra Sable Inalámbrica', brandName: 'MAKITA' },
  { name: 'STMT73795 Juego de Llaves', brandName: 'STANLEY' },
  { name: 'FMHT33550 Cinta Métrica FatMax', brandName: 'STANLEY' },
  { name: '10-099 Cutter Profesional', brandName: 'STANLEY' },
  { name: 'DES-600 Destornilladores', brandName: 'TRUPER' },
  { name: 'PIN-8 Pinza de Electricista', brandName: 'TRUPER' },
  { name: 'CAU-40 Cautín Eléctrico Tipo Lápiz', brandName: 'TRUPER' },
  { name: 'M18 Fuel Taladro Percutor', brandName: 'MILWAUKEE' },
  { name: '2401-20 Destornillador M12', brandName: 'MILWAUKEE' },
  { name: 'Fluke 117 Multímetro Digital', brandName: 'FLUKE' },
  { name: 'Fluke 323 Pinza Amperimétrica', brandName: 'FLUKE' },
  { name: 'VDV526-200 Probador LAN', brandName: 'KLEIN TOOLS' },
  { name: '11063W Pelacables Automático', brandName: 'KLEIN TOOLS' },
  { name: 'J2000-9NE Pinza de Corte Diagonal', brandName: 'KLEIN TOOLS' },
];

export const TOOLS_ITEMS: SeedToolItem[] = [
  {
    name: 'Taladro Percutor DeWalt DCD771C2',
    idInventary: 'HER-001',
    description:
      'Taladro atornillador inalámbrico 20V MAX con 2 baterías de litio',
    modelName: 'DCD771C2 Taladro Percutor',
    typeName: 'HERRAMIENTA ELÉCTRICA',
    statusName: 'Excelente',
    invoiceInternal: 'FAC-HER-2025-001',
    observations:
      'Incluye maletín de plástico rígido, cargador y 2 baterías 20V.',
  },
  {
    name: 'Esmeriladora Angular Bosch GWS 700',
    idInventary: 'HER-002',
    description: 'Esmeriladora angular de 4-1/2" 710W con guarda de protección',
    modelName: 'GWS 700 Mini Esmeriladora',
    typeName: 'HERRAMIENTA ELÉCTRICA',
    statusName: 'Buena',
    invoiceInternal: 'FAC-HER-2025-001',
    observations: 'Herramienta para labores de mantenimiento y corte.',
  },
  {
    name: 'Multímetro Digital Fluke 117',
    idInventary: 'HER-003',
    description:
      'Multímetro para electricistas con tecnología VoltAlert sin contacto y AutoVolt',
    modelName: 'Fluke 117 Multímetro Digital',
    typeName: 'EQUIPO DE MEDICIÓN',
    statusName: 'Excelente',
    invoiceInternal: 'FAC-HER-2025-001',
    observations:
      'Calibración de fábrica vigente. Incluye juego de cables TL75.',
  },
  {
    name: 'Rotomartillo Inalámbrico Makita HP333D',
    idInventary: 'HER-004',
    description:
      'Rotomartillo 12V CXT velocidad variable con luz LED de trabajo',
    modelName: 'HP333D Rotomartillo Inalámbrico',
    typeName: 'HERRAMIENTA ELÉCTRICA',
    statusName: 'Excelente',
    invoiceInternal: 'FAC-HER-2025-002',
    observations: 'Equipo nuevo para brigada de instalaciones.',
  },
  {
    name: 'Pinza Ponchadora y Probador LAN Klein Tools',
    idInventary: 'HER-005',
    description:
      'Probador de cableado Ethernet RJ45/RJ11 y ponchadora modular pass-thru',
    modelName: 'VDV526-200 Probador LAN',
    typeName: 'REDES Y TELECOMUNICACIONES',
    statusName: 'Excelente',
    invoiceInternal: 'FAC-HER-2025-002',
    observations: 'Para uso en cableado estructurado del campus.',
  },
  {
    name: 'Cautín Eléctrico Truper CAU-40',
    idInventary: 'HER-006',
    description:
      'Cautín tipo lápiz de 40W para soldadura de circuitos electrónicos',
    modelName: 'CAU-40 Cautín Eléctrico Tipo Lápiz',
    typeName: 'SOLDADURA Y CALOR',
    statusName: 'Buena',
    invoiceInternal: 'FAC-HER-2025-002',
    observations: 'Incluye base de soporte y esponja limpiadora.',
  },
  {
    name: 'Juego de Destornilladores de Aislamiento Truper',
    idInventary: 'HER-007',
    description: 'Juego de 6 destornilladores dieléctricos aislados a 1000V',
    modelName: 'DES-600 Destornilladores',
    typeName: 'HERRAMIENTA MANUAL',
    statusName: 'Excelente',
    invoiceInternal: 'FAC-HER-2026-001',
    observations: 'Aprobado para tableros eléctricos de baja tensión.',
  },
  {
    name: 'Cinta Métrica Stanley FatMax 8m',
    idInventary: 'HER-008',
    description:
      'Flexómetro de alta durabilidad con recubrimiento BladeArmor de 8 metros',
    modelName: 'FMHT33550 Cinta Métrica FatMax',
    typeName: 'HERRAMIENTA MANUAL',
    statusName: 'Excelente',
    invoiceInternal: 'FAC-HER-2026-001',
    observations: 'Cinta metálica de 1-1/4" resistente a caídas.',
  },
  {
    name: 'Pinza Amperimétrica Fluke 323',
    idInventary: 'HER-009',
    description:
      'Pinza amperimétrica True-RMS 400A AC con medición de voltaje y continuidad',
    modelName: 'Fluke 323 Pinza Amperimétrica',
    typeName: 'EQUIPO DE MEDICIÓN',
    statusName: 'Excelente',
    invoiceInternal: 'FAC-HER-2026-001',
    observations: 'Herramienta para monitoreo de tableros del site.',
  },
  {
    name: 'Sierra Sable Inalámbrica Makita DJR186Z',
    idInventary: 'HER-010',
    description: 'Sierra recíproca 18V LXT con cambio de segueta sin llave',
    modelName: 'DJR186Z Sierra Sable Inalámbrica',
    typeName: 'HERRAMIENTA DE CORTE',
    statusName: 'Buena',
    invoiceInternal: 'FAC-HER-2026-001',
    observations: 'Utilizada para desmonte de canaletas y tubería metálica.',
  },
];
