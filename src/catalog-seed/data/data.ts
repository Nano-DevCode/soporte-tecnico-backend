export interface CatalogItem {
  name: string;
  description?: string;
}
export interface CatalogStatusItem {
  name: string;
  code: string;
}

export interface FaultValidityItem {
  name: string;
  penalizes_equipment: boolean;
  description?: string;
}

export interface SeedData {
  issueTypes: CatalogItem[];
  status: CatalogStatusItem[];
  typeDocuments: CatalogItem[];
  maintenanceTypes: CatalogItem[];
  serviceTypes: CatalogItem[];
  faultValidities: FaultValidityItem[];
}

export const SEED_DATA: SeedData = {
  issueTypes: [
    {
      name: 'Falla de Hardware',
      description:
        'Problemas físicos con componentes de computadoras, impresoras o periféricos (monitor, teclado, mouse).',
    },
    {
      name: 'Falla de Software',
      description:
        'Errores en sistema operativo, aplicaciones, paquetería Office o presencia de virus.',
    },
    {
      name: 'Red e Internet',
      description:
        'Problemas de conectividad, lentitud en la red, falta de acceso a internet o fallas en puntos de red.',
    },
    {
      name: 'Mantenimiento Preventivo',
      description:
        'Solicitud programada para limpieza interna y externa de equipos de cómputo.',
    },
    {
      name: 'Instalación y Configuración',
      description:
        'Solicitud para instalar programas específicos, configurar impresoras o correos institucionales.',
    },
    {
      name: 'Asesoría Técnica',
      description:
        'Apoyo o capacitación breve sobre el uso de herramientas tecnológicas institucionales.',
    },
    {
      name: 'Otro',
    },
  ],

  status: [
    {
      code: 'RECIBIDA',
      name: 'Recibida',
    },
    {
      code: 'RECHAZADA',
      name: 'Rechazada',
    },
    {
      code: 'CANALIZADA',
      name: 'Canalizada',
    },
    {
      code: 'ASIGNADA',
      name: 'Asignada',
    },
    {
      code: 'ATENDIENDO',
      name: 'Atendiendo',
    },
    {
      code: 'SOLUCIONADA',
      name: 'Solucionada',
    },
    {
      code: 'NO_SOLUCIONADA',
      name: 'No solucionada',
    },
    // {
    //   code: 'PAUSADA',
    //   name: 'Pausada',
    // },
    {
      code: 'FINALIZADA',
      name: 'Finalizada',
    },
    {
      code: 'CERRADA',
      name: 'Cerrada',
    },
    {
      code: 'ARCHIVADA',
      name: 'Archivada',
    },
  ],

  typeDocuments: [
    {
      name: 'Formato de Solicitud',
      description:
        'Documento oficial generado al crear el ticket, contiene los detalles iniciales del requerimiento.',
    },
    {
      name: 'Orden de Trabajo',
      description:
        'Documento final que detalla las actividades realizadas y repuestos usados.',
    },
    {
      name: 'Formato de Pausa',
      description:
        'Documento justificativo que explica el motivo por el cual una solicitud entró en estado de pausa.',
    },
  ],
  maintenanceTypes: [
    {
      name: 'Interno',
    },
    {
      name: 'Externo',
    },
  ],
  serviceTypes: [
    {
      name: 'Preventivo',
    },
    {
      name: 'Correctivo',
    },
  ],

  faultValidities: [
    {
      name: 'Falla de equipo',
      penalizes_equipment: true,
      description:
        'Daño real al hardware o software que afecta la salud y ciclo de vida del equipo.',
    },
    {
      name: 'Mantenimiento preventivo',
      penalizes_equipment: false,
      description:
        'Aumentos de RAM, limpieza física, actualizaciones de disco duro.',
    },
    {
      name: 'Error de uso por el usuario',
      penalizes_equipment: false,
      description:
        'Mal uso del equipo, exceso de aplicaciones abiertas, cables desconectados por el usuario.',
    },
    {
      name: 'Factor externo',
      penalizes_equipment: false,
      description:
        'Apagones eléctricos, caída general del proveedor de internet o red externa.',
    },
    {
      name: 'Trámite administrativo',
      penalizes_equipment: false,
      description:
        'Gestiones de software sin falla: reseteo de contraseñas, permisos en carpetas, correos.',
    },
    {
      name: 'Pendiente de diagnóstico',
      penalizes_equipment: false,
      description:
        'La intervención se detuvo antes de poder determinar la causa.',
    },
    {
      name: 'Otro',
      penalizes_equipment: false,
      description:
        'Casos extraordinarios. Describe detalladamente la situación en el campo de diagnóstico.',
    },
  ],
};
