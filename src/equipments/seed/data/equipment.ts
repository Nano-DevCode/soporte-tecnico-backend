export interface CatalogItem {
  brand: string;
  model: string;
  description: string;
}
export interface CatalogSimple {
  name: string;
}
export interface SeedData {
  brands: CatalogSimple[];
  printingTypes: CatalogSimple[];
  printerFunctionTypes: CatalogSimple[];
  equipmentTypes: CatalogSimple[];
  computerEquipmentTypes: CatalogSimple[];
  storageTypes: CatalogSimple[];
  operatingSystems: CatalogSimple[];
  computerProcessors: CatalogItem[];
  typeNetworks: CatalogSimple[];
}

export const SEED_DATA: SeedData = {
  brands: [
    { name: 'HP' },
    { name: 'Dell' },
    { name: 'Lenovo' },
    { name: 'ASUS' },
    { name: 'Acer' },
    { name: 'MSI' },
    { name: 'Apple' },
    { name: 'Samsung' },
    { name: 'Huawei' },
    { name: 'Toshiba' },

    { name: 'IBM' },
    { name: 'Supermicro' },
    { name: 'HPE' },
    { name: 'Synology' },
    { name: 'QNAP' },

    { name: 'Epson' },
    { name: 'Brother' },
    { name: 'Canon' },
    { name: 'Xerox' },
    { name: 'Lexmark' },
    { name: 'Ricoh' },
    { name: 'Kyocera' },

    { name: 'Ubiquiti' },
    { name: 'Aruba' },
    { name: 'Ruckus' },
    { name: 'Cisco' },
    { name: 'TP-Link' },
    { name: 'MikroTik' },
    { name: 'Grandstream' },
    { name: 'Cambium Networks' },
    { name: 'Huawei' },
    { name: 'EnGenius' },
    { name: 'Netgear' },
    { name: 'D-Link' },
    { name: 'Zyxel' },
    { name: 'Fortinet' },
    { name: 'Ruijie' },
    { name: 'Alta Labs' },
    { name: 'Linksys' },
    { name: 'Extreme Networks' },
    { name: 'Meraki' },
    { name: 'UniFi' },

    { name: 'Sophos' },
    { name: 'Palo Alto Networks' },
    { name: 'WatchGuard' },
    { name: 'SonicWall' },

    { name: 'APC' },
    { name: 'CyberPower' },
    { name: 'Tripp Lite' },
    { name: 'Forza' },
    { name: 'CDP' },

    { name: 'Intel' },
    { name: 'AMD' },
    { name: 'NVIDIA' },
    { name: 'Kingston' },
    { name: 'Corsair' },
    { name: 'Logitech' },
    { name: 'Motorola' },

    { name: 'VMware' },
    { name: 'Oracle' },

    { name: 'BenQ' },
    { name: 'LG' },
    { name: 'ViewSonic' },
  ],

  printingTypes: [{ name: 'Laser' }, { name: 'Inyección de tinta' }],

  printerFunctionTypes: [
    { name: 'Multifuncional' },
    { name: 'Matriz de punto' },
    { name: 'Impresion' },
  ],

  equipmentTypes: [
    { name: 'Computadora' },
    { name: 'Red' },
    { name: 'Impresora' },
  ],

  computerEquipmentTypes: [
    // preguntar si generalizo { name: 'Computadora de escritorio' },
    { name: 'Desktop' },
    { name: 'All in One' },
    { name: 'Laptop' },
  ],

  storageTypes: [
    { name: 'HDD' },
    { name: 'SSD SATA' },
    { name: 'SSD NVMe' },
    { name: 'Externo' },
  ],

  operatingSystems: [
    // Windows
    { name: 'Windows 2000' },
    { name: 'Windows XP' },
    { name: 'Windows Vista' },
    { name: 'Windows 7' },
    { name: 'Windows 8' },
    { name: 'Windows 8.1' },
    { name: 'Windows 8.1 PRO' },
    { name: 'Windows 10' },
    { name: 'Windows 10 HOME' },
    { name: 'Windows 10 ENTERPRISE' },
    { name: 'Windows 10 HOME SINGLE LANGUAGE' },
    { name: 'Windows 11' },

    // Linux // general los de ubunto
    { name: 'Ubuntu' },
    { name: 'Debian' },
    { name: 'Fedora' },
    { name: 'Linux Mint' },
    { name: 'Arch Linux' },
    { name: 'Manjaro' },
    { name: 'openSUSE' },
    { name: 'Kali Linux' },
    { name: 'Rocky Linux' },
    { name: 'AlmaLinux' },

    // macOS
    { name: 'Mac OS X Cheetah' },
    { name: 'Mac OS X Tiger' },
    { name: 'Mac OS X Leopard' },
    { name: 'Mac OS X Snow Leopard' },
    { name: 'OS X Lion' },
    { name: 'OS X Yosemite' },
    { name: 'macOS Sierra' },
    { name: 'macOS Mojave' },
    { name: 'macOS Catalina' },
    { name: 'macOS Big Sur' },
    { name: 'macOS Monterey' },
    { name: 'macOS Ventura' },
    { name: 'macOS Sonoma' },
    { name: 'macOS Sequoia' },
  ],

  computerProcessors: [
    // Marca INTEL  diftes modelos
    { brand: 'INTEL', model: 'Core i7-10700T', description: '2.00 GHz' },
    { brand: 'INTEL', model: 'Core i7-10700', description: '2.90 GHz' },
    { brand: 'INTEL', model: 'Core i7-4790', description: '3.60 GHz' },
    { brand: 'INTEL', model: 'Core i7-4770', description: '3.40 GHz' },
    { brand: 'INTEL', model: 'Core i5-4590', description: '3.30 GHz' },
    { brand: 'INTEL', model: 'Core i3-7130U', description: '2.70 GHz' }, // Corregido de "71300"
    { brand: 'INTEL', model: 'Core i3-7020U', description: '2.30 GHz' },
    { brand: 'INTEL', model: 'Core i3-6100', description: '3.70 GHz' },
    { brand: 'INTEL', model: 'Core i3-4150', description: '3.50 GHz' },
    { brand: 'INTEL', model: 'Core i3-2100', description: '3.10 GHz' },
    { brand: 'INTEL', model: 'Xeon Gold 6234', description: '3.30 GHz' },
    { brand: 'INTEL', model: 'Pentium G3220T', description: '2.60 GHz' },
    { brand: 'INTEL', model: 'Celeron J3355', description: '2.00 GHz' },

    //  Marca Intel
    { brand: 'INTEL', model: 'Core i9-14900K', description: '3.20 GHz' },
    { brand: 'INTEL', model: 'Core i9-13900H', description: '2.60 GHz' },
    { brand: 'INTEL', model: 'Core i7-13700K', description: '3.40 GHz' },
    { brand: 'INTEL', model: 'Core i7-12700H', description: '2.30 GHz' },
    { brand: 'INTEL', model: 'Core i7-11700', description: '2.50 GHz' },
    { brand: 'INTEL', model: 'Core i7-8700T', description: '2.40 GHz' },
    { brand: 'INTEL', model: 'Core i5-13400', description: '2.50 GHz' },
    { brand: 'INTEL', model: 'Core i5-12450H', description: '2.00 GHz' },
    { brand: 'INTEL', model: 'Core i5-10400', description: '2.90 GHz' },
    { brand: 'INTEL', model: 'Core i3-13100', description: '3.40 GHz' },
    { brand: 'INTEL', model: 'Core i3-1215U', description: '1.20 GHz' },

    { brand: 'AMD', model: 'Phenom II X2 B59', description: '3.40 GHz' },
    { brand: 'AMD', model: 'A4-6210 APU', description: '1.80 GHz' },
    { brand: 'AMD', model: 'A4-7210 APU', description: '1.80 GHz' },
    { brand: 'AMD', model: 'Ryzen 9 7950X', description: '4.50 GHz' },
    { brand: 'AMD', model: 'Ryzen 7 7840HS', description: '3.80 GHz' },
    { brand: 'AMD', model: 'Ryzen 7 5800X', description: '3.80 GHz' },
    { brand: 'AMD', model: 'Ryzen 5 8600G', description: '4.30 GHz' },
    { brand: 'AMD', model: 'Ryzen 5 5600G', description: '3.90 GHz' },
    { brand: 'AMD', model: 'Ryzen 3 5300G', description: '4.00 GHz' },

    { brand: 'APPLE', model: 'M3 Max (14-Core)', description: '4.05 GHz' },
    { brand: 'APPLE', model: 'M3 Pro (11-Core)', description: '4.05 GHz' },
    { brand: 'APPLE', model: 'M3 (8-Core)', description: '4.05 GHz' },
    { brand: 'APPLE', model: 'M2 Ultra (24-Core)', description: '3.50 GHz' },
    { brand: 'APPLE', model: 'M2 Pro (10-Core)', description: '3.50 GHz' },
    { brand: 'APPLE', model: 'M1 Pro (8-Core)', description: '3.20 GHz' },
    { brand: 'APPLE', model: 'M1 (8-Core)', description: '3.20 GHz' },
  ],

  typeNetworks: [
    { name: 'Switch' },
    { name: 'Router' },
    { name: 'Access Point' },
    { name: 'Modem' },
    { name: 'Firewall' },
  ],
};

export interface ModelSeed {
  brandName: string;
  name: string;
}

export interface ResponsibleSeed {
  num_employe: string;
  name: string;
  first_name: string;
  last_name: string;
  area: string;
  mail: string;
}

export interface EquipmentSeedItem {
  num_inventario: string;
  num_serial: string;
  brandName: string;
  modelName: string;
  typeName: string; // 'Computadora' | 'Impresora' | 'Red'
  departmentAcronym: string;
  responsibleEmail: string;
  description: string;
  computer?: {
    computerType: string;
    storageType: string;
    operatingSystem: string;
    processorModel: string;
    ram: string;
    capacity_storage: string;
    available_storage: string;
  };
  printer?: {
    printingType: string;
    functionType: string;
    color: boolean;
    model_toner: string;
  };
  network?: {
    networkType: string;
    number_ports: number;
    PoE: boolean;
  };
}

export const SEED_MODELS: ModelSeed[] = [
  { brandName: 'Dell', name: 'OptiPlex 7090' },
  { brandName: 'Dell', name: 'Latitude 5420' },
  { brandName: 'Dell', name: 'PowerEdge R740' },
  { brandName: 'Lenovo', name: 'ThinkPad T14' },
  { brandName: 'Lenovo', name: 'ThinkCentre M70q' },
  { brandName: 'HP', name: 'ProDesk 400 G7' },
  { brandName: 'HP', name: 'EliteBook 840 G8' },
  { brandName: 'HP', name: 'LaserJet Pro M404dw' },
  { brandName: 'HP', name: 'Neverstop Laser 1200w' },
  { brandName: 'Epson', name: 'EcoTank L3250' },
  { brandName: 'Epson', name: 'WorkForce Pro WF-C5790' },
  { brandName: 'Brother', name: 'DCP-L2550DW' },
  { brandName: 'Brother', name: 'HL-L6200DW' },
  { brandName: 'Cisco', name: 'Catalyst 2960X-24TS-L' },
  { brandName: 'Cisco', name: 'CBS350-24T-4G' },
  { brandName: 'Cisco', name: 'ISR 4321' },
  { brandName: 'Ubiquiti', name: 'UniFi Switch 24 PoE' },
  { brandName: 'Ubiquiti', name: 'UniFi 6 Pro' },
  { brandName: 'Ubiquiti', name: 'EdgeRouter 4' },
  { brandName: 'TP-Link', name: 'TL-SG1024D' },
  { brandName: 'Apple', name: 'MacBook Pro 14"' },
  { brandName: 'Apple', name: 'Mac mini M2' },
];

export const SEED_RESPONSIBLES: ResponsibleSeed[] = [
  {
    num_employe: 'EMP-2026-001',
    name: 'Carlos',
    first_name: 'Mendoza',
    last_name: 'Vega',
    area: 'Centro de Cómputo',
    mail: 'carlos.mendoza@itoaxaca.edu.mx',
  },
  {
    num_employe: 'EMP-2026-002',
    name: 'Laura',
    first_name: 'Castillo',
    last_name: 'Morales',
    area: 'Redes y Telecomunicaciones',
    mail: 'laura.castillo@itoaxaca.edu.mx',
  },
  {
    num_employe: 'EMP-2026-003',
    name: 'Roberto',
    first_name: 'Silva',
    last_name: 'Domínguez',
    area: 'Laboratorio de Cómputo A',
    mail: 'roberto.silva@itoaxaca.edu.mx',
  },
  {
    num_employe: 'EMP-2026-004',
    name: 'Ana Patricia',
    first_name: 'Ortiz',
    last_name: 'Reyes',
    area: 'Desarrollo Académico',
    mail: 'ana.ortiz@itoaxaca.edu.mx',
  },
  {
    num_employe: 'EMP-2026-005',
    name: 'Miguel Ángel',
    first_name: 'Hernández',
    last_name: 'Ruiz',
    area: 'Soporte Técnico y Mantenimiento',
    mail: 'miguel.hernandez@itoaxaca.edu.mx',
  },
  {
    num_employe: 'EMP-2026-006',
    name: 'Claudia',
    first_name: 'Gómez',
    last_name: 'Vargas',
    area: 'Recursos Materiales',
    mail: 'claudia.gomez@itoaxaca.edu.mx',
  },
];

export const SEED_EQUIPMENT_ITEMS: EquipmentSeedItem[] = [
  // --- COMPUTADORAS ---
  {
    num_inventario: 'INV-PC-001',
    num_serial: 'SN-DELL-7090-01',
    brandName: 'Dell',
    modelName: 'OptiPlex 7090',
    typeName: 'Computadora',
    departmentAcronym: 'SC',
    responsibleEmail: 'carlos.mendoza@itoaxaca.edu.mx',
    description: 'PC de escritorio para administración de sistemas y servidores',
    computer: {
      computerType: 'Desktop',
      storageType: 'SSD NVMe',
      operatingSystem: 'Windows 11',
      processorModel: 'Core i7-10700',
      ram: '16 GB DDR4',
      capacity_storage: '512 GB',
      available_storage: '420 GB',
    },
  },
  {
    num_inventario: 'INV-PC-002',
    num_serial: 'SN-LENOVO-T14-02',
    brandName: 'Lenovo',
    modelName: 'ThinkPad T14',
    typeName: 'Computadora',
    departmentAcronym: 'DIR',
    responsibleEmail: 'carlos.mendoza@itoaxaca.edu.mx',
    description: 'Laptop ejecutiva asignada a Dirección para gestión institucional',
    computer: {
      computerType: 'Laptop',
      storageType: 'SSD NVMe',
      operatingSystem: 'Windows 11',
      processorModel: 'Ryzen 7 5800X',
      ram: '32 GB DDR4',
      capacity_storage: '1 TB',
      available_storage: '850 GB',
    },
  },
  {
    num_inventario: 'INV-PC-003',
    num_serial: 'SN-HP-400G7-03',
    brandName: 'HP',
    modelName: 'ProDesk 400 G7',
    typeName: 'Computadora',
    departmentAcronym: 'SE',
    responsibleEmail: 'ana.ortiz@itoaxaca.edu.mx',
    description: 'Equipo de ventanilla para atención a alumnos en Servicios Escolares',
    computer: {
      computerType: 'Desktop',
      storageType: 'SSD SATA',
      operatingSystem: 'Windows 10',
      processorModel: 'Core i5-10400',
      ram: '16 GB DDR4',
      capacity_storage: '512 GB',
      available_storage: '380 GB',
    },
  },
  {
    num_inventario: 'INV-PC-004',
    num_serial: 'SN-APPLE-MBP-04',
    brandName: 'Apple',
    modelName: 'MacBook Pro 14"',
    typeName: 'Computadora',
    departmentAcronym: 'SAC',
    responsibleEmail: 'ana.ortiz@itoaxaca.edu.mx',
    description: 'Portátil de alto rendimiento para diseño curricular y desarrollo',
    computer: {
      computerType: 'Laptop',
      storageType: 'SSD NVMe',
      operatingSystem: 'macOS Sonoma',
      processorModel: 'M2 Pro (10-Core)',
      ram: '16 GB LPDDR5',
      capacity_storage: '512 GB',
      available_storage: '440 GB',
    },
  },
  {
    num_inventario: 'INV-PC-005',
    num_serial: 'SN-DELL-R740-05',
    brandName: 'Dell',
    modelName: 'PowerEdge R740',
    typeName: 'Computadora',
    departmentAcronym: 'SC',
    responsibleEmail: 'laura.castillo@itoaxaca.edu.mx',
    description: 'Servidor rackeable principal en SITE para virtualización y BD',
    computer: {
      computerType: 'Desktop',
      storageType: 'SSD NVMe',
      operatingSystem: 'Debian',
      processorModel: 'Xeon Gold 6234',
      ram: '64 GB DDR4 ECC',
      capacity_storage: '2 TB',
      available_storage: '1.6 TB',
    },
  },
  {
    num_inventario: 'INV-PC-006',
    num_serial: 'SN-LENOVO-M70Q-06',
    brandName: 'Lenovo',
    modelName: 'ThinkCentre M70q',
    typeName: 'Computadora',
    departmentAcronym: 'SC',
    responsibleEmail: 'roberto.silva@itoaxaca.edu.mx',
    description: 'Equipo Tiny para pruebas y monitoreo en Laboratorio de Cómputo',
    computer: {
      computerType: 'Desktop',
      storageType: 'SSD NVMe',
      operatingSystem: 'Ubuntu',
      processorModel: 'Core i5-12450H',
      ram: '16 GB DDR4',
      capacity_storage: '512 GB',
      available_storage: '410 GB',
    },
  },
  {
    num_inventario: 'INV-PC-007',
    num_serial: 'SN-HP-840G8-07',
    brandName: 'HP',
    modelName: 'EliteBook 840 G8',
    typeName: 'Computadora',
    departmentAcronym: 'RF',
    responsibleEmail: 'miguel.hernandez@itoaxaca.edu.mx',
    description: 'Laptop corporativa asignada al área de Recursos Financieros',
    computer: {
      computerType: 'Laptop',
      storageType: 'SSD NVMe',
      operatingSystem: 'Windows 11',
      processorModel: 'Core i7-11700',
      ram: '16 GB DDR4',
      capacity_storage: '512 GB',
      available_storage: '390 GB',
    },
  },
  {
    num_inventario: 'INV-PC-008',
    num_serial: 'SN-DELL-7090-08',
    brandName: 'Dell',
    modelName: 'OptiPlex 7090',
    typeName: 'Computadora',
    departmentAcronym: 'RH',
    responsibleEmail: 'claudia.gomez@itoaxaca.edu.mx',
    description: 'PC de oficina para expedientes y nóminas en Recursos Humanos',
    computer: {
      computerType: 'Desktop',
      storageType: 'HDD',
      operatingSystem: 'Windows 10',
      processorModel: 'Core i7-10700',
      ram: '16 GB DDR4',
      capacity_storage: '1 TB',
      available_storage: '720 GB',
    },
  },

  // --- IMPRESORAS ---
  {
    num_inventario: 'INV-PRN-001',
    num_serial: 'SN-HP-M404-01',
    brandName: 'HP',
    modelName: 'LaserJet Pro M404dw',
    typeName: 'Impresora',
    departmentAcronym: 'SC',
    responsibleEmail: 'carlos.mendoza@itoaxaca.edu.mx',
    description: 'Impresora láser de alto volumen para el Centro de Cómputo',
    printer: {
      printingType: 'Laser',
      functionType: 'Multifuncional',
      color: false,
      model_toner: 'HP 58A Black',
    },
  },
  {
    num_inventario: 'INV-PRN-002',
    num_serial: 'SN-EPSON-L3250-02',
    brandName: 'Epson',
    modelName: 'EcoTank L3250',
    typeName: 'Impresora',
    departmentAcronym: 'DIR',
    responsibleEmail: 'ana.ortiz@itoaxaca.edu.mx',
    description: 'Impresora multifuncional de inyección continua a color en Dirección',
    printer: {
      printingType: 'Inyección de tinta',
      functionType: 'Multifuncional',
      color: true,
      model_toner: 'Epson 544 CMYK',
    },
  },
  {
    num_inventario: 'INV-PRN-003',
    num_serial: 'SN-BROTHER-2550-03',
    brandName: 'Brother',
    modelName: 'DCP-L2550DW',
    typeName: 'Impresora',
    departmentAcronym: 'SE',
    responsibleEmail: 'claudia.gomez@itoaxaca.edu.mx',
    description: 'Impresora multifuncional láser monocromática en Servicios Escolares',
    printer: {
      printingType: 'Laser',
      functionType: 'Multifuncional',
      color: false,
      model_toner: 'Brother TN-660',
    },
  },
  {
    num_inventario: 'INV-PRN-004',
    num_serial: 'SN-EPSON-C5790-04',
    brandName: 'Epson',
    modelName: 'WorkForce Pro WF-C5790',
    typeName: 'Impresora',
    departmentAcronym: 'SAC',
    responsibleEmail: 'miguel.hernandez@itoaxaca.edu.mx',
    description: 'Multifuncional departamental rápida en Subdirección Académica',
    printer: {
      printingType: 'Inyección de tinta',
      functionType: 'Multifuncional',
      color: true,
      model_toner: 'Epson T941 CMYK',
    },
  },

  // --- REDES ---
  {
    num_inventario: 'INV-NET-001',
    num_serial: 'SN-CISCO-2960X-01',
    brandName: 'Cisco',
    modelName: 'Catalyst 2960X-24TS-L',
    typeName: 'Red',
    departmentAcronym: 'SC',
    responsibleEmail: 'laura.castillo@itoaxaca.edu.mx',
    description: 'Switch capa 2 principal de distribución en rack SITE central',
    network: {
      networkType: 'Switch',
      number_ports: 24,
      PoE: true,
    },
  },
  {
    num_inventario: 'INV-NET-002',
    num_serial: 'SN-UBIQUITI-USW24-02',
    brandName: 'Ubiquiti',
    modelName: 'UniFi Switch 24 PoE',
    typeName: 'Red',
    departmentAcronym: 'SC',
    responsibleEmail: 'laura.castillo@itoaxaca.edu.mx',
    description: 'Switch PoE administrable para alimentación de APs y telefonía IP',
    network: {
      networkType: 'Switch',
      number_ports: 24,
      PoE: true,
    },
  },
  {
    num_inventario: 'INV-NET-003',
    num_serial: 'SN-CISCO-ISR4321-03',
    brandName: 'Cisco',
    modelName: 'ISR 4321',
    typeName: 'Red',
    departmentAcronym: 'SC',
    responsibleEmail: 'laura.castillo@itoaxaca.edu.mx',
    description: 'Router de borde WAN y enlace de fibra óptica institucional',
    network: {
      networkType: 'Router',
      number_ports: 4,
      PoE: false,
    },
  },
  {
    num_inventario: 'INV-NET-004',
    num_serial: 'SN-UBIQUITI-U6PRO-04',
    brandName: 'Ubiquiti',
    modelName: 'UniFi 6 Pro',
    typeName: 'Red',
    departmentAcronym: 'SAC',
    responsibleEmail: 'laura.castillo@itoaxaca.edu.mx',
    description: 'Punto de acceso WiFi 6 instalado en pasillo de Subdirección Académica',
    network: {
      networkType: 'Access Point',
      number_ports: 1,
      PoE: true,
    },
  },
  {
    num_inventario: 'INV-NET-005',
    num_serial: 'SN-TPLINK-SG1024D-05',
    brandName: 'TP-Link',
    modelName: 'TL-SG1024D',
    typeName: 'Red',
    departmentAcronym: 'CI',
    responsibleEmail: 'roberto.silva@itoaxaca.edu.mx',
    description: 'Switch Gigabit para módulo de computadoras en Centro de Información',
    network: {
      networkType: 'Switch',
      number_ports: 24,
      PoE: false,
    },
  },
];
