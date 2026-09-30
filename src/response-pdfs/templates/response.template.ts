import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import * as fs from 'fs';
import * as path from 'path';

// Asegúrate de que esta ruta sea correcta en tu entorno de producción
const imagesPath = path.join(process.cwd(), 'src', 'assets', 'images');

// Carga del logo en Base64
const logoBase64 = `data:image/png;base64,${fs
  .readFileSync(path.join(imagesPath, 'ito.png'))
  .toString('base64')}`;

// ─── INTERFACES ───
export interface OrdenTrabajoData {
  folio_interno: string;
  folio_externo: string;
  folio_ot: string;
  fecha: string;
  work_done: string;
  diagnosis: string;

  nombreVerifico: string;
  firmaVerifico?: string;
  fechaVerifico?: string;

  tipoMantenimiento?: { nombre: string };
  tipoServicio?: { nombre: string };

  aprobo: {
    nombreCompleto: string;
    fecha?: string;
    firma?: string;
  };

  solicitud: {
    coordinationAtencion: string;
    user: {
      departamento: { nombre: string };
    };
  };

  viculacion: {
    name: string;
    firma: string;
    fecha: string;
  };
}

// ─── GENERADOR DE DEFINICIÓN DEL PDF ───
export const getResponse = (data: OrdenTrabajoData): TDocumentDefinitions => {
  const esInterno = data.tipoMantenimiento?.nombre === 'Interno';
  const esExterno = data.tipoMantenimiento?.nombre === 'Externo';

  return {
    pageMargins: [40, 40, 40, 40],
    content: [
      // ─── ENCABEZADO ───
      {
        fontSize: 10,
        table: {
          widths: [80, '*', 180],
          body: [
            [
              {
                image: logoBase64,
                width: 60,
                rowSpan: 3,
                alignment: 'center',
                margin: [0, 5, 0, 5],
              },
              {
                text: 'Formato para Orden de Trabajo de Mantenimiento',
                margin: [5, 5, 5, 5],
              },
              { text: 'Código: TecNM-AD-PO-001-04', margin: [5, 5, 5, 5] },
            ],
            [
              {},
              {
                text: 'Referencia a la Norma ISO 9001:2015 6.1, 7.1, 7.2, 7.4, 7.5.1, 8.1\nReferencia a la Norma ISO 14001:2015 4.1, 6.1, 8.1, 8.2',
                rowSpan: 2,
                margin: [5, 5, 5, 5],
              },
              { text: 'Revisión: 0', margin: [5, 5, 5, 5] },
            ],
            [{}, {}, { text: 'Página 1 de 1', margin: [5, 5, 5, 5] }],
          ],
        },
        margin: [0, 0, 0, 15],
      },

      // ─── TÍTULO ───
      {
        text: 'Orden de Trabajo de Mantenimiento',
        bold: true,
        alignment: 'center',
        margin: [0, 0, 0, 8],
      },

      // ─── NÚMERO DE ORDEN ───
      {
        text: [
          { text: 'Número de orden: ', bold: true },
          { text: data.folio_interno, bold: true },
        ],
        alignment: 'right',
        bold: true,
        margin: [0, 0, 0, 10],
      },

      // ─── TABLA MANTENIMIENTO / TIPO / ASIGNADO ───
      {
        layout: {
          paddingTop: function (i) {
            return i >= 7 ? 0 : 2;
          },
          paddingBottom: function (i) {
            return i >= 7 ? 0 : 2;
          },
          paddingLeft: function (i) {
            return i >= 7 ? 0 : 4;
          },
          paddingRight: function (i) {
            return i >= 7 ? 0 : 4;
          },
        },
        table: {
          widths: ['auto', '*', '*'],
          heights: function (row) {
            if (row === 4) {
              return 255;
            }
            return 0;
          },
          body: [
            [
              {
                text: 'Mantenimiento:',
                bold: true,
                margin: [5, 0, 5, 0],
                border: [true, true, false, true],
              },
              {
                text: esInterno ? 'X Interno' : 'Interno',
                bold: true,
                margin: [5, 0, 5, 0],
                border: [false, true, false, true],
              },
              {
                text: esExterno ? 'X Externo' : 'Externo',
                bold: true,
                margin: [5, 0, 5, 0],

                border: [false, true, true, true],
              },
            ],
            [
              {
                text: 'Tipo de servicio:',
                bold: true,
                margin: [5, 0, 5, 0],
                border: [true, true, false, true],
              },
              {
                text: data.tipoServicio?.nombre ?? '',
                colSpan: 2,
                margin: [5, 0, 5, 0],
                border: [false, true, true, true],
              },
              {},
            ],
            [
              {
                text: 'Asignado a:',
                bold: true,
                margin: [5, 0, 5, 0],
                border: [true, true, false, true],
              },
              {
                text: data.solicitud.coordinationAtencion,
                colSpan: 2,
                margin: [5, 0, 5, 0],
                border: [false, true, true, true],
              },
              {},
            ],
            // ─── TABLA TRABAJO ───
            [
              {
                text: [{ text: 'Fecha de realización: ', bold: true }],
                margin: [5, 0, 5, 0],
                border: [true, true, false, true],
              },
              {
                text: data.fecha,
                colSpan: 2,
                margin: [5, 0, 5, 0],
                border: [false, true, true, true],
              },
              {},
            ],
            [
              {
                text: [
                  { text: 'Diagnostico: ', bold: true },
                  { text: data.diagnosis },
                  { text: '\n\n' },
                  { text: 'Trabajo Realizado: ', bold: true },
                  { text: data.work_done },
                ],
                colSpan: 3,
                // Aumentamos el margen aquí para darle todo el espacio que le quitamos a las firmas
                margin: [5, 0, 5, 0],
                border: [true, true, true, false],
              },
              {},
              {},
            ],
            [
              {
                text: [
                  { text: 'Departamento: ', bold: true },
                  { text: data.solicitud.user.departamento.nombre },
                ],
                colSpan: 3,
                bold: true,
                margin: [5, 0, 5, 0],
                border: [true, false, true, false],
              },
              {},
              {},
            ],
            [
              {
                text: [
                  { text: 'Folio: ', bold: true },
                  { text: data.folio_externo },
                ],
                colSpan: 3,
                bold: true,
                margin: [5, 0, 5, 0],
                border: [true, false, true, true],
              },
              {},
              {},
            ],

            // ─── FILAS CON FIRMA ELECTRÓNICA COMPACTA ───
            [
              {
                colSpan: 3,
                margin: 0,
                layout: {
                  hLineWidth: function () {
                    return 0;
                  },
                  vLineWidth: function (i) {
                    return i === 1 ? 1 : 0;
                  },
                  vLineColor: function () {
                    return 'black';
                  },
                  paddingLeft: function () {
                    return 0;
                  },
                  paddingRight: function () {
                    return 0;
                  },
                  paddingTop: function () {
                    return 0;
                  },
                  paddingBottom: function () {
                    return 0;
                  },
                },
                table: {
                  widths: ['50%', '50%'],
                  body: [
                    [
                      {
                        text: [
                          { text: 'Verificado y Liberado por:\n', bold: true },
                          { text: data.nombreVerifico },
                        ],
                        margin: [5, 4, 5, 4],
                      },
                      {
                        text: [
                          { text: 'Fecha: ', bold: true },
                          { text: `${data.fechaVerifico}\n` },
                          // Sello digital pegado a la fecha
                          {
                            text: data.firmaVerifico ? 'Firma digital: ' : '',
                            fontSize: 8,
                            bold: true,
                            color: '#444444',
                          },
                          {
                            text: data.firmaVerifico ? data.firmaVerifico : '',
                            fontSize: 7.5,
                            color: '#555555',
                            alignment: 'left',
                            wordBreak: 'break-all',
                          },
                        ],
                        margin: [5, 4, 5, 4],
                      },
                    ],
                  ],
                },
              },
              {},
              {},
            ],
            [
              {
                colSpan: 3,
                margin: 0,
                layout: {
                  hLineWidth: function () {
                    return 0;
                  },
                  vLineWidth: function (i) {
                    return i === 1 ? 1 : 0;
                  },
                  vLineColor: function () {
                    return 'black';
                  },
                  paddingLeft: function () {
                    return 0;
                  },
                  paddingRight: function () {
                    return 0;
                  },
                  paddingTop: function () {
                    return 0;
                  },
                  paddingBottom: function () {
                    return 0;
                  },
                },
                table: {
                  widths: ['50%', '50%'],
                  body: [
                    [
                      {
                        text: [
                          { text: 'Aprobado por:\n', bold: true },
                          { text: data.aprobo.nombreCompleto },
                        ],
                        margin: [5, 4, 5, 4],
                      },
                      {
                        text: [
                          { text: 'Fecha: ', bold: true },
                          { text: `${data.aprobo.fecha}\n` },
                          {
                            text: data.aprobo.firma ? 'Firma digital: ' : '',
                            fontSize: 8,
                            bold: true,
                            color: '#444444',
                          },
                          {
                            text: data.aprobo.firma ? data.aprobo.firma : '',
                            fontSize: 7.5,
                            color: '#555555',
                            alignment: 'left',
                            wordBreak: 'break-all',
                          },
                        ],
                        margin: [5, 4, 5, 4],
                      },
                    ],
                  ],
                },
              },
              {},
              {},
            ],
            [
              {
                colSpan: 3,
                margin: 0,
                layout: {
                  hLineWidth: function () {
                    return 0;
                  },
                  vLineWidth: function (i) {
                    return i === 1 ? 1 : 0;
                  },
                  vLineColor: function () {
                    return 'black';
                  },
                  paddingLeft: function () {
                    return 0;
                  },
                  paddingRight: function () {
                    return 0;
                  },
                  paddingTop: function () {
                    return 0;
                  },
                  paddingBottom: function () {
                    return 0;
                  },
                },
                table: {
                  widths: ['50%', '50%'],
                  body: [
                    [
                      {
                        text: [
                          { text: 'Aprobado por:\n', bold: true },
                          {
                            text: 'Departamento de Planeación Programación y Presupuestación',
                          },
                        ],
                        margin: [5, 4, 5, 4],
                      },
                      {
                        text: [
                          { text: 'Fecha: ', bold: true },
                          { text: `${data.viculacion.fecha}\n` },
                          {
                            text: data.viculacion.firma
                              ? 'Firma digital: '
                              : '',
                            fontSize: 8,
                            bold: true,
                            color: '#444444',
                          },
                          {
                            text: data.viculacion.firma
                              ? data.viculacion.firma
                              : '',
                            fontSize: 7.5,
                            color: '#555555',
                            alignment: 'left',
                            wordBreak: 'break-all',
                          },
                        ],
                        margin: [5, 4, 5, 4],
                      },
                    ],
                  ],
                },
              },
              {},
              {},
            ],
          ],
        },
        margin: [0, 0, 0, 20],
      },

      // ─── FOOTER ───
      {
        text: 'C.c.p. Departamento de Planeación Programación y Presupuestación',
        fontSize: 9,
        margin: [0, 5, 0, 2],
      },
      { text: 'C.c.p. Área Solicitante.', fontSize: 9, margin: [0, 0, 0, 10] },

      // ─── PIE DE PÁGINA ───
      {
        columns: [
          { text: 'TecNM-AD-PO-001-04', fontSize: 9, alignment: 'left' },
          { text: 'Rev. 0', fontSize: 9, alignment: 'right' },
        ],
      },
    ],
    defaultStyle: { font: 'Roboto', fontSize: 10 },
  };
};
