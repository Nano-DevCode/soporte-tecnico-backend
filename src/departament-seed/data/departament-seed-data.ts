export interface departamentSeed {
  name: string;
  priority: number;
  acronym: string;
}

export const seed_departament: departamentSeed[] = [
  { name: 'Dirección', priority: 1, acronym: 'DIR' },
  { name: 'Subdirección Académica', priority: 1, acronym: 'SAC' },
  {
    name: 'Departamento de Sistemas y Computación',
    priority: 1,
    acronym: 'SC',
  },
  /* {
    name: 'Departamento de Centro de Cómputo',
    priority: 1,
    acronym: 'CC',
  }, // ¡Descomentado y listo para usarse! */
  {
    name: 'Subdirección de Servicios Administrativos',
    priority: 2,
    acronym: 'SAD',
  },
  {
    name: 'Subdirección de Planeación y Vinculación',
    priority: 2,
    acronym: 'SPV',
  },
  {
    name: 'División de Estudios de Posgrado e Investigación',
    priority: 2,
    acronym: 'DEPI',
  },
  { name: 'Departamento de Servicios Escolares', priority: 2, acronym: 'SE' },
  { name: 'Departamento de Ciencias Básicas', priority: 3, acronym: 'CB' },
  {
    name: 'Departamento de Ciencias Económico Administrativo',
    priority: 3,
    acronym: 'CEA',
  },
  { name: 'Departamento de Ciencias de la Tierra', priority: 3, acronym: 'CT' },
  { name: 'Departamento de Desarrollo Académico', priority: 3, acronym: 'DA' },
  { name: 'Departamento de Eléctrica', priority: 3, acronym: 'IE' },
  { name: 'Departamento de Electrónica', priority: 3, acronym: 'IEE' },
  { name: 'Departamento de Ingeniería Industrial', priority: 3, acronym: 'II' },
  { name: 'Departamento de Ingeniería Química', priority: 3, acronym: 'IQ' },
  { name: 'Departamento de Metal Mecánica', priority: 3, acronym: 'IM' },
  { name: 'División de Estudios Profesionales', priority: 3, acronym: 'DEP' },
  { name: 'Departamento de Recursos Humanos', priority: 3, acronym: 'RH' },
  {
    name: 'Departamento de Mantenimiento y Equipo',
    priority: 3,
    acronym: 'ME',
  },
  { name: 'Departamento de Recursos Financieros', priority: 3, acronym: 'RF' },
  {
    name: 'Departamento de Recursos Materiales y Servicios',
    priority: 3,
    acronym: 'RMS',
  },
  {
    name: 'Departamento de Gestión Tecnológica y Vinculación',
    priority: 3,
    acronym: 'GTV',
  },
  {
    name: 'Departamento de Planeación Programación y Presupuestación',
    priority: 3,
    acronym: 'PPP',
  },
  { name: 'Centro de Información', priority: 3, acronym: 'CI' },

  // 4 - BAJA (Sindicatos, Difusión y Extraescolares)
  {
    name: 'Departamento de Comunicación y Difusión',
    priority: 4,
    acronym: 'CD',
  },
  {
    name: 'Departamento de Actividades Extraescolares',
    priority: 4,
    acronym: 'DAE',
  },
  { name: 'Sindicato Sección 22', priority: 4, acronym: 'SIND22' },
  { name: 'Sindicato Sección 61', priority: 4, acronym: 'SIND61' },
];
