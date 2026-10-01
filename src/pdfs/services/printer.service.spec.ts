import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import PdfPrinter from 'pdfmake';
import { TDocumentDefinitions, BufferOptions } from 'pdfmake/interfaces';
import { PrinterService } from './printer.service';

jest.mock('pdfmake');

describe('PrinterService', () => {
  let mockConfigService: { get: jest.Mock };
  let mockCreatePdfKitDocument: jest.Mock;

  beforeEach(() => {
    mockCreatePdfKitDocument = jest.fn().mockReturnValue('fake-pdf-document');

    (PdfPrinter as unknown as jest.Mock).mockImplementation(() => ({
      createPdfKitDocument: mockCreatePdfKitDocument,
    }));

    mockConfigService = {
      get: jest.fn(),
    };

    jest.clearAllMocks();
  });

  const compileServiceWithEnvironment = async (
    environment: string,
  ): Promise<PrinterService> => {
    mockConfigService.get.mockImplementation((key: string) => {
      if (key === 'environment') return environment;
      return null;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrinterService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    return module.get<PrinterService>(PrinterService);
  };

  describe('Inicialización de rutas de fuentes', () => {
    it('debe configurar las rutas hacia "src/assets/fonts" si el entorno NO es producción', async () => {
      await compileServiceWithEnvironment('development');

      const expectedBaseFontsPath = path.join(
        process.cwd(),
        'src',
        'assets',
        'fonts',
      );

      const expectedFonts = {
        Roboto: {
          normal: path.join(expectedBaseFontsPath, 'Roboto-Regular.ttf'),
          bold: path.join(expectedBaseFontsPath, 'Roboto-Medium.ttf'),
          italics: path.join(expectedBaseFontsPath, 'Roboto-Italic.ttf'),
          bolditalics: path.join(
            expectedBaseFontsPath,
            'Roboto-MediumItalic.ttf',
          ),
        },
      };

      expect(PdfPrinter).toHaveBeenCalledWith(expectedFonts);
    });

    it('debe configurar las rutas hacia "dist/assets/fonts" si el entorno ES producción', async () => {
      await compileServiceWithEnvironment('production');

      const expectedBaseFontsPath = path.join(
        process.cwd(),
        'dist',
        'assets',
        'fonts',
      );

      const expectedFonts = {
        Roboto: {
          normal: path.join(expectedBaseFontsPath, 'Roboto-Regular.ttf'),
          bold: path.join(expectedBaseFontsPath, 'Roboto-Medium.ttf'),
          italics: path.join(expectedBaseFontsPath, 'Roboto-Italic.ttf'),
          bolditalics: path.join(
            expectedBaseFontsPath,
            'Roboto-MediumItalic.ttf',
          ),
        },
      };

      expect(PdfPrinter).toHaveBeenCalledWith(expectedFonts);
    });
  });

  describe('createPdf', () => {
    let service: PrinterService;

    beforeEach(async () => {
      service = await compileServiceWithEnvironment('development');
    });

    const docDefinition: TDocumentDefinitions = {
      content: ['Hola Mundo'],
    };

    it('debe llamar a createPdfKitDocument con la definición y opciones enviadas', () => {
      const options: BufferOptions = { autoPrint: true };

      const result = service.createPdf(docDefinition, options);

      expect(mockCreatePdfKitDocument).toHaveBeenCalledWith(
        docDefinition,
        options,
      );
      expect(result).toBe('fake-pdf-document');
    });

    it('debe enviar un objeto vacío {} como opciones si no se proveen', () => {
      service.createPdf(docDefinition);

      expect(mockCreatePdfKitDocument).toHaveBeenCalledWith(docDefinition, {});
    });
  });
});
