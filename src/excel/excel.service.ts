import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import {
  BadgeTheme,
  MatrixReportConfig,
  ReportConfig,
  SurveyReportConfig,
} from './interfaces/report-config.interface';

const AUTO_PALETTE: BadgeTheme[] = [
  { fill: 'FFDBEAFE', text: 'FF1E3A8A' }, // Blue
  { fill: 'FFF3E8FF', text: 'FF6B21A8' }, // Purple
  { fill: 'FFCCFBF1', text: 'FF115E59' }, // Teal
  { fill: 'FFFCE7F3', text: 'FF9D174D' }, // Pink
  { fill: 'FFFEF3C7', text: 'FF92400E' }, // Amber
  { fill: 'FFDCFCE7', text: 'FF166534' }, // Green
  { fill: 'FFFEE2E2', text: 'FF991B1B' }, // Red
  { fill: 'FFF3F4F6', text: 'FF374151' }, // Gray
];

@Injectable()
export class ExcelService {
  generateDynamicReport(config: ReportConfig) {
    const { title, sheetName = 'Reporte', columns, data } = config;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName, {
      properties: { tabColor: { argb: 'FF0F172A' } },
    });

    // Configurar columnas
    worksheet.columns = columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width || 20,
    }));

    // Dejar espacio para título, subtítulo y encabezados
    worksheet.spliceRows(1, 0, [], [], [], []);

    const totalCols = Math.max(columns.length, 3);

    // Título
    worksheet.mergeCells(1, 1, 2, totalCols);
    const titleCell = worksheet.getCell(1, 1);
    titleCell.value = title;
    titleCell.font = {
      name: 'Inter',
      size: 18,
      bold: true,
      color: { argb: 'FF0F172A' },
    };
    titleCell.alignment = {
      vertical: 'middle',
      horizontal: 'left',
      indent: 1,
    };

    // Subtítulo
    worksheet.mergeCells(3, 1, 3, totalCols);
    const subtitleCell = worksheet.getCell(3, 1);
    subtitleCell.value = `Reporte generado el: ${new Date().toLocaleDateString()}`;
    subtitleCell.font = {
      name: 'Inter',
      size: 10,
      italic: true,
      color: { argb: 'FF64748B' },
    };
    subtitleCell.alignment = {
      horizontal: 'left',
      indent: 1,
    };

    // Encabezados (fila 5)
    const headerRow = worksheet.getRow(5);

    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF8FAFC' },
      };

      cell.font = {
        name: 'Inter',
        bold: true,
        color: { argb: 'FF334155' },
        size: 10,
      };

      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'medium', color: { argb: 'FFCBD5E1' } },
      };

      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
      };
    });

    headerRow.height = 24;

    const lastColLetter = worksheet.getColumn(columns.length).letter;
    worksheet.autoFilter = `A5:${lastColLetter}5`;

    const dynamicColorMap = new Map<string, BadgeTheme>();
    let paletteIndex = 0;

    data.forEach((item) => {
      const row = worksheet.addRow(item);
      row.height = 20;

      columns.forEach((colConfig, index) => {
        const cell = row.getCell(index + 1);
        const cellValue = item[colConfig.key];

        cell.font = {
          name: 'Inter',
          color: { argb: 'FF0F172A' },
          size: 10,
        };

        cell.border = {
          bottom: {
            style: 'thin',
            color: { argb: 'FFF1F5F9' },
          },
        };

        cell.alignment = {
          vertical: 'middle',
          horizontal: 'left',
          indent: 1,
        };

        if (
          colConfig.isBadge &&
          cellValue !== undefined &&
          cellValue !== null
        ) {
          const value = String(cellValue);

          let theme: BadgeTheme;

          if (colConfig.badgeColors?.[value]) {
            theme = colConfig.badgeColors[value];
          } else {
            if (!dynamicColorMap.has(value)) {
              dynamicColorMap.set(
                value,
                AUTO_PALETTE[paletteIndex % AUTO_PALETTE.length],
              );
              paletteIndex++;
            }

            theme = dynamicColorMap.get(value)!;
          }

          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: {
              argb: theme.fill,
            },
          };

          cell.font = {
            bold: true,
            color: {
              argb: theme.text,
            },
            size: 10,
          };

          cell.alignment = {
            vertical: 'middle',
            horizontal: 'center',
          };
        }
      });
    });

    worksheet.views = [
      {
        state: 'frozen',
        ySplit: 5,
        showGridLines: false,
      },
    ];

    return workbook;
  }

  generateTicketsMatrixReport(config: MatrixReportConfig) {
    const {
      title,
      sheetName = 'Reporte Matricial',
      issueTypes,
      data,
      totalsRow,
    } = config;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName, {
      properties: { tabColor: { argb: 'FF1B396A' } },
    });

    const excelColumns: Partial<ExcelJS.Column>[] = [
      { header: 'Departamento', key: 'departamento', width: 30 },
    ];

    issueTypes.forEach((issue) => {
      excelColumns.push({ header: issue, key: issue, width: 20 });
    });

    excelColumns.push({ header: 'Total', key: 'total', width: 15 });

    const totalCols = excelColumns.length;

    worksheet.columns = excelColumns;

    worksheet.spliceRows(1, 0, [], [], [], []);

    worksheet.mergeCells(1, 1, 2, totalCols);
    const titleCell = worksheet.getCell(1, 1);
    titleCell.value = title;
    titleCell.font = {
      name: 'Inter',
      size: 18,
      bold: true,
      color: { argb: 'FF1B396A' },
    };
    titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

    worksheet.mergeCells(3, 1, 3, totalCols);
    const subtitleCell = worksheet.getCell(3, 1);
    subtitleCell.value = `Reporte generado el: ${new Date().toLocaleDateString()}`;
    subtitleCell.font = {
      name: 'Inter',
      size: 10,
      italic: true,
      color: { argb: 'FF64748B' },
    };
    subtitleCell.alignment = { horizontal: 'left', indent: 1 };

    const headerRow = worksheet.getRow(5);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1B396A' },
      };
      cell.font = {
        name: 'Inter',
        bold: true,
        color: { argb: 'FFFFFFFF' },
        size: 11,
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    headerRow.height = 24;

    data.forEach((item) => {
      const row = worksheet.addRow(item);
      row.height = 20;

      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Inter', color: { argb: 'FF0F172A' }, size: 10 };
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFF1F5F9' } },
        };

        cell.alignment = {
          vertical: 'middle',
          horizontal: colNumber === 1 ? 'left' : 'center',
          indent: colNumber === 1 ? 1 : 0,
        };

        if (colNumber === totalCols) {
          cell.font = { ...cell.font, bold: true, size: 11 };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8FAFC' },
          };
          cell.border = {
            left: { style: 'medium', color: { argb: 'FF94A3B8' } },
          };
        }
      });
    });

    const finalRow = worksheet.addRow(totalsRow);
    finalRow.height = 22;
    finalRow.eachCell((cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF8FAFC' },
      };
      cell.font = {
        name: 'Inter',
        bold: true,
        color: { argb: 'FF1B396A' },
        size: 11,
      };
      cell.border = { top: { style: 'medium', color: { argb: 'FF94A3B8' } } };
      if (colNumber === totalCols) {
        cell.border = {
          ...cell.border,
          left: { style: 'medium', color: { argb: 'FF94A3B8' } },
        };
      }
      cell.alignment = {
        vertical: 'middle',
        horizontal: colNumber === 1 ? 'left' : 'center',
        indent: colNumber === 1 ? 1 : 0,
      };
    });

    worksheet.views = [
      {
        state: 'frozen',
        ySplit: 5,
        xSplit: 1,
        showGridLines: false,
      },
    ];

    return workbook;
  }

  // CUESTIONARIO DE SATISFACCIÓN
  generateSurveyReport(config: SurveyReportConfig) {
    const {
      title,
      sheetName = 'Satisfacción',
      columns,
      data,
      overallAverage,
    } = config;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName, {
      properties: { tabColor: { argb: 'FF059669' } },
    });

    const totalCols = Math.max(columns.length, 3);

    worksheet.columns = columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width || 25,
    }));

    worksheet.spliceRows(1, 0, [], [], [], []);

    worksheet.mergeCells(1, 1, 2, totalCols);
    const titleCell = worksheet.getCell(1, 1);
    titleCell.value = title;
    titleCell.font = {
      name: 'Inter',
      size: 18,
      bold: true,
      color: { argb: 'FF064E3B' },
    };
    titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

    worksheet.mergeCells(3, 1, 3, totalCols);
    const subtitleCell = worksheet.getCell(3, 1);
    const dateStr = new Date().toLocaleDateString();
    const avgStr =
      overallAverage !== undefined
        ? ` | Promedio General: ${overallAverage.toFixed(1)} / 5.0`
        : '';
    subtitleCell.value = `Reporte generado el: ${dateStr}${avgStr}`;
    subtitleCell.font = {
      name: 'Inter',
      size: 10,
      italic: true,
      color: { argb: 'FF64748B' },
    };
    subtitleCell.alignment = { horizontal: 'left', indent: 1 };

    const headerRow = worksheet.getRow(5);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF059669' },
      };
      cell.font = {
        name: 'Inter',
        bold: true,
        color: { argb: 'FFFFFFFF' },
        size: 10,
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF047857' } },
        bottom: { style: 'medium', color: { argb: 'FF065F46' } },
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true,
      };
    });

    const lastColLetter = worksheet.getColumn(columns.length).letter;
    worksheet.autoFilter = `A5:${lastColLetter}5`;

    const ratingColors: Record<string, BadgeTheme> = {
      '5': { fill: 'FFDCFCE7', text: 'FF166534' },
      '4': { fill: 'FFECFCCB', text: 'FF3F6212' },
      '3': { fill: 'FFFEF3C7', text: 'FF92400E' },
      '2': { fill: 'FFFFEDD5', text: 'FF9A3412' },
      '1': { fill: 'FFFEE2E2', text: 'FF991B1B' },
    };

    data.forEach((item) => {
      const row = worksheet.addRow(item);

      columns.forEach((colConfig, index) => {
        const cell = row.getCell(index + 1);
        const cellValue: unknown = item[colConfig.key];

        cell.font = { name: 'Inter', color: { argb: 'FF0F172A' }, size: 10 };
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFF1F5F9' } },
          left: { style: 'thin', color: { argb: 'FFF8FAFC' } },
          right: { style: 'thin', color: { argb: 'FFF8FAFC' } },
        };

        if (
          colConfig.isRating &&
          cellValue !== undefined &&
          cellValue !== null
        ) {
          const scoreStr = String(Math.round(Number(cellValue)));
          const theme = ratingColors[scoreStr] || {
            fill: 'FFF3F4F6',
            text: 'FF374151',
          };

          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: theme.fill },
          };
          cell.font = {
            name: 'Inter',
            bold: true,
            color: { argb: theme.text },
            size: 10,
          };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        } else if (colConfig.isLongText) {
          cell.alignment = {
            vertical: 'middle',
            horizontal: 'left',
            indent: 1,
            wrapText: true,
          };
        } else {
          cell.alignment = {
            vertical: 'middle',
            horizontal: 'left',
            indent: 1,
          };
        }
      });
    });

    worksheet.views = [{ state: 'frozen', ySplit: 5, showGridLines: false }];

    return workbook;
  }
}
