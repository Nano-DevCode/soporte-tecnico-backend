import { Test, TestingModule } from '@nestjs/testing';
import { PdfsController } from './pdfs.controller';
import { PdfsService } from '../services/pdfs.service';
import type { Response } from 'express';

import { Reflector } from '@nestjs/core';
import { I18nService } from 'nestjs-i18n';

describe('PdfsController', () => {
  let controller: PdfsController;
  let service: jest.Mocked<PdfsService>;

  const mockPdfDoc = {
    pipe: jest.fn(),
    end: jest.fn(),
  };

  const mockResponse = {
    setHeader: jest.fn(),
  } as unknown as Response;

  beforeEach(async () => {
    const mockPdfsService = {
      pdfRequest: jest.fn().mockReturnValue(mockPdfDoc),
      pdfResponse: jest.fn().mockReturnValue(mockPdfDoc),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PdfsController],
      providers: [
        {
          provide: PdfsService,
          useValue: mockPdfsService,
        },
        {
          provide: I18nService,
          useValue: { t: jest.fn((key: string) => key) },
        },
        Reflector,
      ],
    }).compile();

    controller = module.get<PdfsController>(PdfsController);
    service = module.get(PdfsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('pdfRequest', () => {
    it('debe configurar headers y hacer pipe del documento a la respuesta', () => {
      controller.pdfRequest(mockResponse);

      expect(service.pdfRequest).toHaveBeenCalled();
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/pdf',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'inline; filename="solicitud-servicio-preview.pdf"',
      );
      expect(mockPdfDoc.pipe).toHaveBeenCalledWith(mockResponse);
      expect(mockPdfDoc.end).toHaveBeenCalled();
    });
  });

  describe('pdfResponse', () => {
    it('debe configurar headers y hacer pipe del documento de respuesta', () => {
      controller.pdfResponse(mockResponse);

      expect(service.pdfResponse).toHaveBeenCalled();
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/pdf',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'inline; filename="respuesta-ticket-preview.pdf"',
      );
      expect(mockPdfDoc.pipe).toHaveBeenCalledWith(mockResponse);
      expect(mockPdfDoc.end).toHaveBeenCalled();
    });
  });
});
