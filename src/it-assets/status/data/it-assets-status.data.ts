export interface SeedItAssetsStatus {
  name: string;
  description: string;
}

export const seedItAssetsStatus: SeedItAssetsStatus[] = [
  {
    name: 'Excelente',
    description:
      'El activo está en condiciones óptimas, es nuevo o no tiene desgaste visible, y funciona a la perfección.',
  },
  {
    name: 'Buena',
    description:
      'El activo presenta un desgaste menor o estético por el uso normal, pero su funcionamiento es completamente confiable.',
  },
  {
    name: 'Regular',
    description:
      'El activo muestra un desgaste evidente, detalles considerables o requiere cierta maña para usarse, pero aún cumple con su función principal.',
  },
  {
    name: 'Mala',
    description:
      'El activo tiene fallas, le faltan accesorios o presenta daños estructurales que dificultan mucho su uso seguro y eficiente.',
  },
  {
    name: 'En mantenimiento',
    description:
      'El activo se encuentra actualmente en revisión, limpieza, calibración o reparación.',
  },
  {
    name: 'Perdida',
    description:
      'No se conoce la ubicación física actual del activo o se asume como extraviado accidentalmente.',
  },
  {
    name: 'Dado de baja',
    description:
      'El activo ha sido retirado del inventario de forma definitiva debido a obsolescencia, robo, pérdida irreparable o desecho.',
  },
];
