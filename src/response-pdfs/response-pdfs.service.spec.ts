import { Test, TestingModule } from '@nestjs/testing';
import { ResponsePdfsService } from './response-pdfs.service';
import { PrinterService } from 'src/printer/printer.service';
import { FilesService } from 'src/files/files.service';
import { getRequest, getResponse } from 'src/response-pdfs/templates';
import { SignatureRole } from 'src/response-signature/entities/response-signature.entity';
import { Ticket } from '../tickets/entities/ticket.entity';

// Mock de templates
jest.mock('src/response-pdfs/templates', () => ({
  getRequest: jest.fn().mockReturnValue({ definition: 'fake-request' }),
  getResponse: jest.fn().mockReturnValue({ definition: 'fake-response' }),
}));

// Mock de utilidades de fecha
jest.mock('src/users/util/dateTransformToString', () => ({
  formatDatePretty: jest.fn().mockReturnValue('19 de febrero de 2026'),
}));

describe('ResponsePdfsService', () => {
  let service: ResponsePdfsService;
  let printerService: jest.Mocked<PrinterService>;
  let filesService: jest.Mocked<FilesService>;

  type MockPdfDoc = ReturnType<PrinterService['createPdf']>;

  // Fábrica para simular PdfStream
  type MockPdfStream = {
    on: (event: string, cb: unknown) => MockPdfStream;
    end: () => void;
  };

  const createMockPdfStream = (shouldFail = false): MockPdfStream => {
    let dataCb: (chunk: Buffer) => void;
    let endCb: () => void;
    let errorCb: (err: Error) => void;

    const mockStream: MockPdfStream = {
      on: jest.fn((event: string, cb: unknown) => {
        if (event === 'data') dataCb = cb as (chunk: Buffer) => void;
        if (event === 'end') endCb = cb as () => void;
        if (event === 'error') errorCb = cb as (err: Error) => void;
        return mockStream;
      }) as MockPdfStream['on'],
      end: jest.fn(() => {
        if (shouldFail) {
          if (errorCb) errorCb(new Error('Error de stream simulado'));
        } else {
          if (dataCb) dataCb(Buffer.from('fake-pdf-content'));
          if (endCb) endCb();
        }
      }) as MockPdfStream['end'],
    };

    return mockStream;
  };

  // Mock Ticket
  const mockTicketDate = new Date('2026-02-19T10:00:00Z');
  const mockTicket = {
    folio: 'FOLIO-123',
    internal_folio: 'INT-123',
    description: 'La computadora no enciende',
    available_hours: '9:00 - 18:00',
    affected_name: 'PC-LAB-01',
    created_at: mockTicketDate,
    jefe_depto: {
      name: 'Juan',
      paternalSurname: 'Pérez',
      maternalSurname: 'López',
      department: {
        name: 'Sistemas',
        acronym: 'SIS',
      },
    },
    coordinator: {
      name: 'Coordinador Test',
    },
    response: {
      work_done: 'Se cambió la fuente de poder',
      diagnosis: 'Fuente quemada',
      maintenance_type: { name: 'Correctivo' },
      service_type: { name: 'Hardware' },
      computing_center_manager: {
        names: 'Admin',
        first_last_name: 'Centro',
        second_last_name: 'Computo',
      },
      signatures: [
        {
          role: SignatureRole.JEFE_DEPTO,
          signature_hash: 'hash-jefe',
          signed_at: new Date(),
        },
        {
          role: SignatureRole.JEFE_CC,
          signature_hash: 'hash-cc',
          signed_at: new Date(),
        },
        {
          role: SignatureRole.PLANEACION,
          signature_hash: 'hash-plan',
          signed_at: new Date(),
        },
      ],
    },
  } as unknown as Ticket;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResponsePdfsService,
        {
          provide: PrinterService,
          useValue: {
            createPdf: jest.fn(),
          },
        },
        {
          provide: FilesService,
          useValue: {
            uploadFile: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ResponsePdfsService>(ResponsePdfsService);
    printerService = module.get(PrinterService);
    filesService = module.get(FilesService);

    jest
      .spyOn(Date.prototype, 'toLocaleString')
      .mockReturnValue('19 de febrero de 2026, 10:00');

    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('pdfRequest', () => {
    it('debe crear un PDF de solicitud con datos en duro', () => {
      // FIX: Aseguramos que retorne un objeto literal para que `toBe` no falle
      const fakePdfKitDoc = { type: 'document' } as unknown as MockPdfDoc;
      printerService.createPdf.mockReturnValue(fakePdfKitDoc);

      const result = service.pdfRequest();

      expect(getRequest).toHaveBeenCalled();
      expect(printerService.createPdf).toHaveBeenCalledWith({
        definition: 'fake-request',
      });
      expect(result).toBe(fakePdfKitDoc);
    });
  });

  describe('pdfResponse', () => {
    it('debe crear un PDF de respuesta con datos en duro', () => {
      const fakePdfKitDoc = { type: 'document' } as unknown as MockPdfDoc;
      printerService.createPdf.mockReturnValue(fakePdfKitDoc);

      const result = service.pdfResponse();

      expect(getResponse).toHaveBeenCalled();
      expect(printerService.createPdf).toHaveBeenCalledWith({
        definition: 'fake-response',
      });
      expect(result).toBe(fakePdfKitDoc);
    });
  });

  describe('pdfRequestBucket', () => {
    it('debe generar el PDF, convertir el stream a Buffer y subirlo al FilesService', async () => {
      const mockStream = createMockPdfStream();
      printerService.createPdf.mockReturnValue(
        mockStream as unknown as MockPdfDoc,
      );
      const uploadResult: Awaited<ReturnType<FilesService['uploadFile']>> = {
        fileName: 'solicitud.pdf',
        url: 'http://bucket/solicitud.pdf',
        bucket: 'pdfs-request',
      };
      filesService.uploadFile.mockResolvedValue(uploadResult);

      const result = await service.pdfRequestBucket(mockTicket);

      expect(getRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          folio: 'FOLIO-123',
          description: 'La computadora no enciende',
          created_at: '19 de febrero de 2026, 10:00',
        }),
      );

      // FIX: Usar un match más permisivo para el archivo (Multer mockeado)
      expect(filesService.uploadFile).toHaveBeenCalledWith(
        expect.objectContaining({
          originalname: 'solicitud-FOLIO-123.pdf',
          mimetype: 'application/pdf',
        }),
        'pdfs-request',
        'FOLIO-123',
      );

      expect(result).toEqual(uploadResult);
    });

    it('debe rechazar la promesa si ocurre un error en el stream (on error)', async () => {
      const mockStream = createMockPdfStream(true);
      printerService.createPdf.mockReturnValue(
        mockStream as unknown as MockPdfDoc,
      );

      await expect(service.pdfRequestBucket(mockTicket)).rejects.toThrow(
        'Error de stream simulado',
      );

      expect(filesService.uploadFile).not.toHaveBeenCalled();
    });
  });

  describe('pdfResponseBucket', () => {
    it('debe generar el PDF de respuesta con firmas, convertirlo y subirlo al bucket', async () => {
      const mockStream = createMockPdfStream();
      printerService.createPdf.mockReturnValue(
        mockStream as unknown as MockPdfDoc,
      );
      const uploadResult: Awaited<ReturnType<FilesService['uploadFile']>> = {
        fileName: 'respuesta.pdf',
        url: 'http://bucket/respuesta.pdf',
        bucket: 'pdfs-response',
      };
      filesService.uploadFile.mockResolvedValue(uploadResult);

      const result = await service.pdfResponseBucket(mockTicket);

      // FIX: Adaptar expectedResponse al nuevo formato que usa tu ResponseTemplate
      const expectedResponse = {
        folio_interno: 'INT-123',
        firmaVerifico: 'hash-jefe',
        aprobo: expect.objectContaining({ firma: 'hash-cc' }) as unknown,
        viculacion: expect.objectContaining({ firma: 'hash-plan' }) as unknown,
      };

      expect(getResponse).toHaveBeenCalledWith(
        expect.objectContaining(expectedResponse),
      );

      expect(filesService.uploadFile).toHaveBeenCalledWith(
        expect.objectContaining({
          originalname: 'respuesta-FOLIO-123.pdf',
          mimetype: 'application/pdf',
        }),
        'pdfs-response',
        'FOLIO-123',
      );

      expect(result).toEqual(uploadResult);
    });
  });
});
