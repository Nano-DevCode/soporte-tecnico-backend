import { CreateToolsStatusDto } from 'src/tools-status/dto/create-tools-status.dto';

export const seedItAssetsStatus: CreateToolsStatusDto[] = [
  {
    name: 'Excelente',
    description:
      'La herramienta está en condiciones óptimas, es nueva o no tiene desgaste visible, y funciona a la perfección.',
  },
  {
    name: 'Buena',
    description:
      'La herramienta presenta un desgaste menor o estético por el uso normal, pero su funcionamiento es completamente confiable.',
  },
  {
    name: 'Regular',
    description:
      'La herramienta muestra un desgaste evidente, detalles considerables o requiere cierta maña para usarse, pero aún cumple con su función principal.',
  },
  {
    name: 'Mala',
    description:
      'La herramienta tiene fallas, le faltan accesorios o presenta daños estructurales que dificultan mucho su uso seguro y eficiente.',
  },
  {
    name: 'En mantenimiento',
    description:
      'La herramienta se encuentra actualmente en revisión, limpieza, calibración o reparación.',
  },
  {
    name: 'Perdida',
    description:
      'No se conoce la ubicación física actual de la herramienta o se asume como extraviada accidentalmente.',
  },
  {
    name: 'Dado de baja',
    description:
      'La herramienta ha sido retirada del inventario de forma definitiva debido a obsolescencia, robo, pérdida irreparable o desecho.',
  },
];
