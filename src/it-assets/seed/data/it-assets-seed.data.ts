export interface SeedModel {
  name: string;
  brandName: string;
}

export interface SeedItAssetItem {
  name: string;
  idInventary: string;
  serialNumber: string;
  description: string;
  modelName: string;
  typeName: string;
  statusName: string;
  invoiceInternal?: string;
  observations?: string;
}

export const IT_ASSETS_BRANDS: string[] = [
  'DELL',
  'HP',
  'LENOVO',
  'CISCO',
  'APPLE',
  'LOGITECH',
  'SAMSUNG',
  'ASUS',
  'EPSON',
  'TP-LINK',
];

export const IT_ASSETS_TYPES: string[] = [
  'LAPTOP',
  'DESKTOP',
  'MONITOR',
  'SWITCH',
  'ROUTER',
  'ACCESS POINT',
  'IMPRESORA',
  'PROYECTOR',
  'TECLADO Y MOUSE',
  'WEBCAM',
];

export const IT_ASSETS_INVOICES: string[] = [
  'FAC-IT-2025-001',
  'FAC-IT-2025-002',
  'FAC-IT-2026-001',
  'FAC-IT-2026-002',
];

export const IT_ASSETS_MODELS: SeedModel[] = [
  { name: 'Latitude 5420', brandName: 'DELL' },
  { name: 'OptiPlex 7090', brandName: 'DELL' },
  { name: 'UltraSharp U2723QE', brandName: 'DELL' },
  { name: 'ProBook 450 G9', brandName: 'HP' },
  { name: 'EliteDesk 800 G6', brandName: 'HP' },
  { name: 'LaserJet Pro M404dn', brandName: 'HP' },
  { name: 'ThinkPad T14 Gen 3', brandName: 'LENOVO' },
  { name: 'ThinkCentre M70q', brandName: 'LENOVO' },
  { name: 'ThinkVision P24h', brandName: 'LENOVO' },
  { name: 'Catalyst 2960-X', brandName: 'CISCO' },
  { name: 'Catalyst 9200L', brandName: 'CISCO' },
  { name: 'CBS350-24T-4G', brandName: 'CISCO' },
  { name: 'MacBook Pro 14 M2', brandName: 'APPLE' },
  { name: 'Mac mini M2', brandName: 'APPLE' },
  { name: 'iMac 24 M3', brandName: 'APPLE' },
  { name: 'MX Master 3S', brandName: 'LOGITECH' },
  { name: 'C920 Pro HD Webcam', brandName: 'LOGITECH' },
  { name: 'MK270 Combo', brandName: 'LOGITECH' },
  { name: 'ViewFinity S8', brandName: 'SAMSUNG' },
  { name: 'Odyssey G5 27"', brandName: 'SAMSUNG' },
  { name: 'ExpertBook B5', brandName: 'ASUS' },
  { name: 'ProArt PA278CV', brandName: 'ASUS' },
  { name: 'EcoTank L3250', brandName: 'EPSON' },
  { name: 'PowerLite E20 Proyector', brandName: 'EPSON' },
  { name: 'Omada EAP650 AX3000', brandName: 'TP-LINK' },
  { name: 'TL-SG1024D Gigabit', brandName: 'TP-LINK' },
];

export const IT_ASSETS_ITEMS: SeedItAssetItem[] = [
  {
    name: 'Laptop Dell Latitude 5420',
    idInventary: 'INV-IT-001',
    serialNumber: 'SN-DELL-5420-001',
    description: 'Intel Core i7 11th Gen, 16GB RAM, 512GB SSD NVMe',
    modelName: 'Latitude 5420',
    typeName: 'LAPTOP',
    statusName: 'Excelente',
    invoiceInternal: 'FAC-IT-2025-001',
    observations: 'Equipo nuevo entregado en caja original con cargador USB-C.',
  },
  {
    name: 'Desktop HP EliteDesk 800 G6',
    idInventary: 'INV-IT-002',
    serialNumber: 'SN-HP-800-002',
    description: 'Intel Core i5 10th Gen, 16GB RAM, 256GB SSD + 1TB HDD',
    modelName: 'EliteDesk 800 G6',
    typeName: 'DESKTOP',
    statusName: 'Buena',
    invoiceInternal: 'FAC-IT-2025-001',
    observations: 'Equipo para área de soporte técnico operativo.',
  },
  {
    name: 'Monitor Dell UltraSharp 27"',
    idInventary: 'INV-IT-003',
    serialNumber: 'SN-DELL-U27-003',
    description:
      'Monitor 4K IPS Black, USB-C Hub integrado, 90W Power Delivery',
    modelName: 'UltraSharp U2723QE',
    typeName: 'MONITOR',
    statusName: 'Excelente',
    invoiceInternal: 'FAC-IT-2025-001',
    observations: 'Asignado a estación de trabajo principal.',
  },
  {
    name: 'Switch Cisco Catalyst 9200L',
    idInventary: 'INV-IT-004',
    serialNumber: 'SN-CSCO-9200-004',
    description:
      'Switch Administrable 24 puertos PoE+ Gigabit con 4 enlaces 10G SFP+',
    modelName: 'Catalyst 9200L',
    typeName: 'SWITCH',
    statusName: 'Excelente',
    invoiceInternal: 'FAC-IT-2025-002',
    observations: 'Instalado en rack principal del MDF central.',
  },
  {
    name: 'Laptop Lenovo ThinkPad T14',
    idInventary: 'INV-IT-005',
    serialNumber: 'SN-LNV-T14-005',
    description:
      'AMD Ryzen 7 PRO, 32GB RAM, 1TB SSD NVMe, teclado retroiluminado',
    modelName: 'ThinkPad T14 Gen 3',
    typeName: 'LAPTOP',
    statusName: 'Excelente',
    invoiceInternal: 'FAC-IT-2025-002',
    observations: 'Equipo para coordinación de sistemas.',
  },
  {
    name: 'Impresora HP LaserJet Pro M404dn',
    idInventary: 'INV-IT-006',
    serialNumber: 'SN-HP-M404-006',
    description:
      'Impresora láser monocromática de alta velocidad para red Ethernet',
    modelName: 'LaserJet Pro M404dn',
    typeName: 'IMPRESORA',
    statusName: 'Buena',
    invoiceInternal: 'FAC-IT-2026-001',
    observations: 'Ubicada en área administrativa.',
  },
  {
    name: 'Access Point TP-Link Omada AX3000',
    idInventary: 'INV-IT-007',
    serialNumber: 'SN-TPL-EAP-007',
    description:
      'Access Point Wi-Fi 6 de techo PoE 802.3at con gestión centralizada',
    modelName: 'Omada EAP650 AX3000',
    typeName: 'ACCESS POINT',
    statusName: 'Excelente',
    invoiceInternal: 'FAC-IT-2026-001',
    observations: 'Montado en pasillo de laboratorios.',
  },
  {
    name: 'MacBook Pro 14" M2 Pro',
    idInventary: 'INV-IT-008',
    serialNumber: 'SN-APPL-MBP-008',
    description:
      'Chip M2 Pro 10-core CPU, 16-core GPU, 16GB RAM unificada, 512GB SSD',
    modelName: 'MacBook Pro 14 M2',
    typeName: 'LAPTOP',
    statusName: 'Excelente',
    invoiceInternal: 'FAC-IT-2026-002',
    observations: 'Equipo para desarrollo y multimedia.',
  },
  {
    name: 'Monitor Samsung ViewFinity S8',
    idInventary: 'INV-IT-009',
    serialNumber: 'SN-SAM-VF-009',
    description: 'Monitor 27" UHD IPS HDR400 con panel antideslumbrante',
    modelName: 'ViewFinity S8',
    typeName: 'MONITOR',
    statusName: 'Buena',
    invoiceInternal: 'FAC-IT-2026-002',
    observations: 'Conexión HDMI y DisplayPort operativa.',
  },
  {
    name: 'Cámara Web Logitech C920 Pro',
    idInventary: 'INV-IT-010',
    serialNumber: 'SN-LOGI-C920-010',
    description: 'Webcam Full HD 1080p con micrófonos estéreo integrados',
    modelName: 'C920 Pro HD Webcam',
    typeName: 'WEBCAM',
    statusName: 'Excelente',
    invoiceInternal: 'FAC-IT-2026-002',
    observations: 'Instalada en sala de videoconferencias.',
  },
];
