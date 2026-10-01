import { Injectable } from '@nestjs/common';
import { FilesService } from 'src/files/files.service';
import { PrinterService } from './printer.service';
import { getRequest } from '../templates/request.template';
import { getResponse } from '../templates/response.template';
import { Ticket } from 'src/tickets/entities/ticket.entity';
import { SignatureRole } from 'src/response-signature/entities/response-signature.entity';
import { formatDatePretty } from 'src/users/util/dateTransformToString';
import { TicketStatus } from 'src/common/machine/TicketStateMachine.machine';
import { BufferOptions, TDocumentDefinitions } from 'pdfmake/interfaces';

export interface PdfStream {
  on(
    event: 'data',
    listener: (chunk: Buffer | Uint8Array | string) => void,
  ): this;
  on(event: 'end', listener: () => void): this;
  on(event: 'error', listener: (error: Error) => void): this;
  end(): void;
}

@Injectable()
export class PdfsService {
  constructor(
    private readonly printerService: PrinterService,
    private readonly filesService: FilesService,
  ) {}

  async getPdfBuffer(pdfDoc: PdfStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      pdfDoc.on('data', (chunk) => {
        const chunkBuffer = Buffer.isBuffer(chunk)
          ? chunk
          : Buffer.from(chunk as Uint8Array);
        chunks.push(chunkBuffer);
      });
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', reject);
      pdfDoc.end();
    });
  }

  createPdf(
    docDefinition: TDocumentDefinitions,
    options: BufferOptions = {},
  ): PDFKit.PDFDocument {
    return this.printerService.createPdf(docDefinition, options);
  }

  async generateBuffer(
    docDefinition: TDocumentDefinitions,
    options: BufferOptions = {},
  ): Promise<Buffer> {
    const pdfDoc = this.createPdf(docDefinition, options) as unknown as PdfStream;
    return this.getPdfBuffer(pdfDoc);
  }

  pdfRequest(): PDFKit.PDFDocument {
    const docDefinition = getRequest({
      folio: '1',
      ot_folio: 'OT-0001-SIS',
      user: {
        name: 'Juan',
        surnameP: 'Pérez',
        surnameM: 'López',
        departamento: {
          nombre: 'Departamento de Sistemas',
          abreviatura: 'SIS',
        },
      },
      description: 'La computadora no enciende.',
      equipmentManager: 'Jose Luis Martinez Alvarado',
      responsibleSchedule: 'De 9:00  a 16:00 ',
      created_at: '2026-02-19',
    });

    return this.printerService.createPdf(docDefinition);
  }

  pdfResponse(): PDFKit.PDFDocument {
    const docDefinition = getResponse({
      folio_interno: '1',
      folio_externo: '1',
      fecha: '2026-02-19',
      diagnosis: 'Se realizó mantenimiento correctivo al equipo de cómputo',
      work_done: 'Se realizó mantenimiento correctivo al equipo de cómputo',
      nombreVerifico: 'Profa quecha',
      firmaVerifico:
        'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDH7/j3Xb9... Kj8zQwIDAQAB',
      tipoMantenimiento: { nombre: 'Interno' },
      tipoServicio: { nombre: 'Correctivo' },
      aprobo: {
        nombreCompleto: 'María García Martínez',
        firma:
          'MIICWwIBAAKBgQDQx1MIICWwIBAAKBgQDQx1MIICWwIBAAKBgQDQx1MIICWwIBAAKBgQDQx1MIICWwIBAAKBgQDQx1MIICWwIBAAKBgQDQx1MIICWwIBAAKBgQDQx1Pz0oOqwIDAQAB',
      },
      solicitud: {
        coordinationAtencion: 'Juan',
        user: {
          departamento: { nombre: 'Departamento de Sistemas' },
        },
      },
      viculacion: {
        name: 'Roberto Sánchez',
        firma:
          'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA',
        fecha: '2026-02-20',
      },
      folio_ot: '',
    });

    return this.printerService.createPdf(docDefinition);
  }

  async pdfRequestBucket(ticket: Ticket) {
    const docDefinition = getRequest({
      folio: ticket.folio,
      ot_folio: ticket.ot_folio,
      user: {
        name: ticket.jefe_depto.name,
        surnameP: ticket.jefe_depto.paternalSurname,
        surnameM: ticket.jefe_depto.maternalSurname,
        departamento: {
          nombre: ticket.jefe_depto.department.name,
          abreviatura: ticket.jefe_depto.department.acronym,
        },
      },
      description: ticket.description,
      responsibleSchedule: ticket.available_hours,
      equipmentManager: ticket.affected_name,
      created_at: ticket.created_at.toLocaleString('es-MX', {
        timeZone: 'America/Mexico_City',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    });

    const pdfDoc = this.printerService.createPdf(docDefinition) as unknown as PdfStream;
    const pdfBuffer = await this.getPdfBuffer(pdfDoc);

    return this.filesService.uploadBuffer(
      pdfBuffer,
      `solicitud-${ticket.folio}.pdf`,
      'application/pdf',
      'pdfs-request',
      ticket.folio,
    );
  }

  async pdfResponseBucket(ticket: Ticket) {
    const fechaFinalizacion = (() => {
      const histories = ticket.ticket_histories || [];
      const finishedIndex = histories.findIndex(
        (h) => (h.status.code as TicketStatus) === TicketStatus.FINALIZADA,
      );

      if (finishedIndex > 0) {
        const prevStatus = histories[finishedIndex - 1].status
          .code as TicketStatus;
        if (
          prevStatus === TicketStatus.SOLUCIONADA ||
          prevStatus === TicketStatus.NO_SOLUCIONADA
        ) {
          return histories[finishedIndex - 1].created_at;
        }
        return histories[finishedIndex].created_at;
      }

      return histories.length > 0
        ? histories[histories.length - 1].created_at
        : ticket.created_at;
    })();

    const docDefinition = getResponse({
      folio_interno: ticket.internal_folio,
      folio_externo: ticket.folio,
      folio_ot: ticket.ot_folio,
      fecha: formatDatePretty(fechaFinalizacion),
      work_done: ticket.response?.work_done || '',
      diagnosis: ticket.response?.diagnosis || '',
      nombreVerifico: `${ticket.jefe_depto?.name || ''} ${ticket.jefe_depto?.paternalSurname || ''} ${ticket.jefe_depto?.maternalSurname || ''}`.trim(),
      firmaVerifico:
        ticket.response?.signatures?.find(
          (signature) => signature.role === SignatureRole.JEFE_DEPTO,
        )?.signature_hash ?? '',
      fechaVerifico: formatDatePretty(
        ticket.response?.signatures?.find(
          (signature) => signature.role === SignatureRole.JEFE_DEPTO,
        )?.signed_at,
      ),
      tipoMantenimiento: { nombre: ticket.response?.maintenance_type?.name || '' },
      tipoServicio: { nombre: ticket.response?.service_type?.name || '' },
      aprobo: {
        nombreCompleto: ticket.response?.computing_center_manager
          ? `${ticket.response.computing_center_manager.names} ${ticket.response.computing_center_manager.first_last_name} ${ticket.response.computing_center_manager.second_last_name}`
          : '',
        fecha: formatDatePretty(fechaFinalizacion),
        firma:
          ticket.response?.signatures?.find(
            (signature) => signature.role === SignatureRole.JEFE_CC,
          )?.signature_hash ?? '',
      },
      solicitud: {
        coordinationAtencion: ticket.coordinator
          ? `${ticket.coordinator.name} ${ticket.coordinator.paternalSurname} ${ticket.coordinator.maternalSurname}`
          : '',
        user: {
          departamento: { nombre: ticket.jefe_depto?.department?.name || '' },
        },
      },
      viculacion: {
        fecha: formatDatePretty(
          ticket.response?.signatures?.find(
            (signature) => signature.role === SignatureRole.PLANEACION,
          )?.signed_at,
        ),
        name: '',
        firma:
          ticket.response?.signatures?.find(
            (signature) => signature.role === SignatureRole.PLANEACION,
          )?.signature_hash ?? '',
      },
    });

    const pdfDoc = this.printerService.createPdf(docDefinition) as unknown as PdfStream;
    const pdfBuffer = await this.getPdfBuffer(pdfDoc);
    const folio = ticket.folio;

    return this.filesService.uploadBuffer(
      pdfBuffer,
      `respuesta-${folio}.pdf`,
      'application/pdf',
      'pdfs-response',
      folio.toString(),
    );
  }
}

// Alias para garantizar compatibilidad con consumidores existentes
export { PdfsService as ResponsePdfsService };

