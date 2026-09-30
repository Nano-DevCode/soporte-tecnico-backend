import { Test, TestingModule } from '@nestjs/testing';
import { ExcelService } from './excel.service';
import * as ExcelJS from 'exceljs';
import {
  MatrixReportConfig,
  ReportConfig,
  SurveyReportConfig,
} from './interfaces/report-config.interface';

describe('ExcelService', () => {
  let service: ExcelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExcelService],
    }).compile();

    service = module.get<ExcelService>(ExcelService);

    jest
      .spyOn(Date.prototype, 'toLocaleDateString')
      .mockReturnValue('19/02/2026');
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  /**
   * Helper para evitar repetir el cast de ExcelJS
   */
  const getPatternFill = (cell: ExcelJS.Cell): ExcelJS.FillPattern =>
    cell.fill as ExcelJS.FillPattern;

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  /* ========================================================================
     REPORTES DINÁMICOS
  ======================================================================== */

  describe('generateDynamicReport', () => {
    const config: ReportConfig = {
      title: 'Reporte de Usuarios',
      sheetName: 'Usuarios',
      columns: [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Nombre', key: 'name', width: 30 },
        {
          header: 'Estado',
          key: 'status',
          isBadge: true,
          badgeColors: {
            Activo: {
              fill: 'FF00FF00',
              text: 'FF000000',
            },
          },
        },
        {
          header: 'Rol',
          key: 'role',
          isBadge: true,
        },
      ],
      data: [
        {
          id: 1,
          name: 'Juan',
          status: 'Activo',
          role: 'Admin',
        },
        {
          id: 2,
          name: 'Pedro',
          status: 'Inactivo',
          role: 'User',
        },
      ],
    };

    it('debe generar el documento base', () => {
      const workbook = service.generateDynamicReport(config);
      const sheet = workbook.getWorksheet('Usuarios');

      expect(sheet).toBeDefined();

      const titleCell = sheet!.getCell(1, 1);

      expect(titleCell.value).toBe('Reporte de Usuarios');
      expect(titleCell.font?.size).toBe(18);
      expect(titleCell.font?.bold).toBe(true);

      const subtitleCell = sheet!.getCell(3, 1);

      expect(subtitleCell.value).toBe('Reporte generado el: 19/02/2026');

      const headerRow = sheet!.getRow(5);

      expect(headerRow.getCell(1).value).toBe('ID');
      expect(headerRow.getCell(2).value).toBe('Nombre');
      expect(headerRow.getCell(3).value).toBe('Estado');

      expect(getPatternFill(headerRow.getCell(1)).fgColor?.argb).toBe(
        'FFF8FAFC',
      );
    });

    it('debe aplicar badges', () => {
      const workbook = service.generateDynamicReport(config);
      const sheet = workbook.getWorksheet('Usuarios');

      const firstDataRow = sheet!.getRow(6);

      const activeCell = firstDataRow.getCell(3);

      expect(getPatternFill(activeCell).fgColor?.argb).toBe('FF00FF00');

      const adminCell = firstDataRow.getCell(4);

      expect(getPatternFill(adminCell).fgColor?.argb).toBe('FFDBEAFE');

      const secondDataRow = sheet!.getRow(7);

      const userCell = secondDataRow.getCell(4);

      expect(getPatternFill(userCell).fgColor?.argb).toBe('FFCCFBF1');
    });
  });

  /* ========================================================================
     MATRIZ
  ======================================================================== */

  describe('generateTicketsMatrixReport', () => {
    const config: MatrixReportConfig = {
      title: 'Matriz de Tickets',
      issueTypes: ['Hardware', 'Software'],
      data: [
        {
          departamento: 'Sistemas',
          Hardware: 5,
          Software: 10,
          total: 15,
        },
        {
          departamento: 'RRHH',
          Hardware: 2,
          Software: 1,
          total: 3,
        },
      ],
      totalsRow: {
        departamento: 'TOTAL GENERAL',
        Hardware: 7,
        Software: 11,
        total: 18,
      },
    };

    it('debe generar la matriz', () => {
      const workbook = service.generateTicketsMatrixReport(config);

      const sheet = workbook.getWorksheet('Reporte Matricial');

      const headerRow = sheet!.getRow(5);

      expect(headerRow.getCell(1).value).toBe('Departamento');
      expect(headerRow.getCell(2).value).toBe('Hardware');
      expect(headerRow.getCell(3).value).toBe('Software');
      expect(headerRow.getCell(4).value).toBe('Total');

      const totalRow = sheet!.getRow(8);

      expect(totalRow.getCell(1).value).toBe('TOTAL GENERAL');
      expect(totalRow.getCell(4).value).toBe(18);

      expect(getPatternFill(totalRow.getCell(1)).fgColor?.argb).toBe(
        'FFF8FAFC',
      );

      expect(totalRow.getCell(4).font?.bold).toBe(true);
    });
  });

  /* ========================================================================
     ENCUESTAS
  ======================================================================== */

  describe('generateSurveyReport', () => {
    const config: SurveyReportConfig = {
      title: 'Satisfacción del Cliente',
      columns: [
        {
          header: 'ID',
          key: 'id',
        },
        {
          header: 'Calificación',
          key: 'score',
          isRating: true,
        },
        {
          header: 'Comentario',
          key: 'feedback',
          isLongText: true,
        },
      ],
      data: [
        {
          id: 1,
          score: 5,
          feedback: 'Excelente servicio, muy rápido.',
        },
        {
          id: 2,
          score: 1,
          feedback: 'Pésimo.',
        },
      ],
      overallAverage: 3.0,
    };

    it('debe generar el reporte de satisfacción', () => {
      const workbook = service.generateSurveyReport(config);

      const sheet = workbook.getWorksheet('Satisfacción');

      const subtitleCell = sheet!.getCell(3, 1);

      expect(subtitleCell.value).toBe(
        'Reporte generado el: 19/02/2026 | Promedio General: 3.0 / 5.0',
      );

      const commentCell = sheet!.getRow(6).getCell(3);

      expect(commentCell.alignment?.wrapText).toBe(true);
    });

    it('debe colorear correctamente las calificaciones', () => {
      const workbook = service.generateSurveyReport(config);

      const sheet = workbook.getWorksheet('Satisfacción');

      const rating5Cell = sheet!.getRow(6).getCell(2);

      expect(getPatternFill(rating5Cell).fgColor?.argb).toBe('FFDCFCE7');

      const rating1Cell = sheet!.getRow(7).getCell(2);

      expect(getPatternFill(rating1Cell).fgColor?.argb).toBe('FFFEE2E2');
    });
  });
});
