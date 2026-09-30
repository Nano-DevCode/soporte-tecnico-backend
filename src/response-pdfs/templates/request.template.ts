import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import * as fs from 'fs';
import * as path from 'path';

/* 🔥 LAS IMÁGENES SE CARGAN UNA SOLA VEZ AL INICIAR LA APP */

const imagesPath = path.join(process.cwd(), 'src', 'assets', 'images');

const logoLeftBase64 = `data:image/png;base64,${fs
  .readFileSync(path.join(imagesPath, 'ito.png'))
  .toString('base64')}`;

const logoRightBase64 = `data:image/png;base64,${fs
  .readFileSync(path.join(imagesPath, 'TecNM.png'))
  .toString('base64')}`;

interface SolicitudData {
  folio: string;
  ot_folio?: string;
  user: {
    name: string;
    surnameP: string;
    surnameM: string;
    departamento: {
      nombre: string;
      abreviatura: string;
    };
  };
  description: string;
  equipmentManager: string;
  responsibleSchedule: string;
  created_at: string;
}

export const getRequest = (data: SolicitudData): TDocumentDefinitions => {
  const folio = `${String(data.folio)}`;
  const nombreCompleto = `${data.user.name} ${data.user.surnameP} ${data.user.surnameM}`;

  return {
    pageMargins: [40, 40, 40, 40],
    content: [
      // ─── ENCABEZADO ───
      {
        columns: [
          {
            image: logoRightBase64,
            height: 50,
            alignment: 'left',
            opacity: 0.5,
          },
          {
            stack: [
              {
                text: 'TECNOLÓGICO NACIONAL DE MÉXICO',
                bold: true,
                alignment: 'center',
                fontSize: 10,
                opacity: 0.5,
              },
              {
                text: 'Instituto Tecnológico de Oaxaca',
                bold: true,
                alignment: 'center',
                fontSize: 10,
                opacity: 0.5,
              },
              {
                text: 'Solicitud de Mantenimiento Correctivo',
                alignment: 'center',
                marginTop: 10,
                fontSize: 11,
                opacity: 0.5,
              },
            ],
            width: '*',
          },
          {
            image: logoLeftBase64,
            height: 50,
            alignment: 'right',
            opacity: 0.5,
          },
        ],
        columnGap: 10,
        margin: [0, 0, 0, 15],
      },

      {
        text: 'REG-7130-03 Rev.02',
        alignment: 'right',
        fontSize: 9,
        color: '#888888',
        margin: [0, 0, 40, 25],
      },

      {
        columns: [
          { text: '', width: '*' },
          {
            width: 200,
            stack: [
              {
                table: {
                  widths: ['*', 20],
                  body: [
                    [
                      {
                        text: 'Recursos Materiales y Servicios:',
                        border: [true, true, true, true],
                      },
                      { text: '', border: [true, true, true, true] },
                    ],
                    [
                      {
                        text: 'Mantenimiento de equipo',
                        border: [true, true, true, true],
                      },
                      { text: '', border: [true, true, true, true] },
                    ],
                    [
                      {
                        text: 'Centro de Cómputo',
                        border: [true, true, true, true],
                      },
                      {
                        text: 'X',
                        alignment: 'center',
                        border: [true, true, true, true],
                      },
                    ],
                  ],
                },
                margin: [0, 0, 0, 15],
              },
            ],
          },
        ],
        margin: [0, 0, 0, 15],
      },
      {
        columns: [
          { text: '', width: '*' },
          {
            stack: [
              {
                text: [{ text: 'Folio: ', bold: true }, { text: folio }],
                alignment: 'right',
                bold: true,
                margin: [0, 0, 0, 0],
              },
            ],
          },
        ],
        margin: [0, 0, 0, 15],
      },

      {
        table: {
          widths: ['*'],
          heights: function (row) {
            if (row === 4) {
              return 255;
            }
            return 0;
          },
          body: [
            [
              {
                text: [
                  { text: 'Área Solicitante: ', bold: true },
                  { text: data.user.departamento.nombre },
                ],
                margin: [5, 12, 5, 12],
              },
            ],
            [
              {
                text: [
                  { text: 'Nombre y Firma del Solicitante: ', bold: true },
                  { text: nombreCompleto },
                ],
                margin: [5, 12, 5, 12],
              },
            ],
            [
              {
                text: [
                  { text: 'Fecha de elaboración: ', bold: true },
                  { text: data.created_at },
                ],
                margin: [5, 12, 5, 12],
              },
            ],
            [
              {
                text: 'Descripción del servicio solicitado o falla a reparar:',
                bold: true,
                margin: [5, 12, 5, 12],
              },
            ],
            [
              {
                stack: [
                  { text: `Descripción del Problema: ${data.description}` },
                  { text: '' },
                  { text: `Responsable del equipo: ${data.equipmentManager}` },
                  { text: '' },
                  {
                    text: `Horario disponible del responsable: ${data.responsibleSchedule}`,
                  },
                ],
                margin: [5, 5, 5, 5],
              },
            ],
          ],
        },
        margin: [0, 0, 0, 20],
      },

      {
        text: 'C.c.p. Departamento de Planeación Programación y Presupuestación',
        fontSize: 9,
        margin: [0, 15, 0, 2],
      },
      {
        text: 'C.c.p. Área Solicitante.',
        fontSize: 9,
      },
    ],

    defaultStyle: {
      font: 'Roboto',
      fontSize: 10,
    },
  };
};
