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
