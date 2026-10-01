import { Injectable } from '@nestjs/common';
import { FilesService } from 'src/files/files.service';
import { PrinterService } from 'src/printer/printer.service';
import { getRequest, getResponse } from 'src/response-pdfs/templates';
import { Ticket } from '../tickets/entities/ticket.entity';
import { SignatureRole } from 'src/response-signature/entities/response-signature.entity';
import { formatDatePretty } from 'src/users/util/dateTransformToString';
import { TicketStatus } from 'src/common/machine/TicketStateMachine.machine';

interface PdfStream {
  on(
    event: 'data',
    listener: (chunk: Buffer | Uint8Array | string) => void,
  ): this;
  on(event: 'end', listener: () => void): this;
  on(event: 'error', listener: (error: Error) => void): this;
  end(): void;
}

@Injectable()
export class ResponsePdfsService {
  constructor(
    private readonly printerServices: PrinterService,
    private readonly filesService: FilesService,
  ) {}

  private async getPdfBuffer(pdfDoc: PdfStream): Promise<Buffer> {
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

  pdfRequest() {
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

    return this.printerServices.createPdf(docDefinition);
  }

  pdfResponse() {
    const docDefinition = getResponse({
      folio_interno: '1',
      folio_externo: '1',
      fecha: '2026-02-19',
      diagnosis: 'Se realizó mantenimiento correctivo al equipo de cómputo',
      work_done: 'Se realizó mantenimiento correctivo al equipo de cómputo',

      // Datos del verificador con su firma electrónica
      nombreVerifico: 'Profa quecha',
      firmaVerifico:
        'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDH7/j3Xb9... (aquí va el hash largo real de tu base de datos) ...Kj8zQwIDAQAB',

      tipoMantenimiento: { nombre: 'Interno' },
      tipoServicio: { nombre: 'Correctivo' },

      // Datos de quien aprueba con su firma electrónica
      aprobo: {
        nombreCompleto: 'María García Martínez',
        firma:
          'MIICWwIBAAKBgQDQx1MIICWwIBAAKBgQDQx1MIICWwIBAAKBgQDQx1MIICWwIBAAKBgQDQx1MIICWwIBAAKBgQDQx1MIICWwIBAAKBgQDQx1MIICWwIBAAKBgQDQx1MIICWwIBAAKBgQDQx1Pz0oOqwIDAQAB',
      },

      solicitud: {
        coordinationAtencion: 'Juan',
        user: {
          departamento: { nombre: 'Departamento de Sistemas' },
        },
      },

      // NUEVO: Datos de Vinculación agregados para cumplir con la interfaz
      viculacion: {
        name: 'Roberto Sánchez',
        firma:
          'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA',
        fecha: '2026-02-20',
      },
      folio_ot: '',
    });

    return this.printerServices.createPdf(docDefinition);
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

    // Generamos el documento y le decimos a TypeScript que cumple con la interfaz
    const pdfDoc = this.printerServices.createPdf(docDefinition) as PdfStream;

    // Convertimos el stream del PDF a Buffer
    const pdfBuffer = await this.getPdfBuffer(pdfDoc);

    // Simulamos el objeto MulterFile para que tu FilesService lo acepte
    const fakeFile = {
      buffer: pdfBuffer,
      originalname: `solicitud-${ticket.folio}.pdf`,
      mimetype: 'application/pdf',
      size: pdfBuffer.length,
      fieldname: 'file',
      encoding: '7bit',
      destination: '',
      filename: '',
      path: '',
    };

    // Subimos el archivo al bucket 'pdfs'.
    const uploadResult = await this.filesService.uploadFile(
      fakeFile,
      'pdfs-request',
      ticket.folio,
    );

    return uploadResult;
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
      // fecha: ticket.created_at.toLocaleString('es-MX', {
      //   year: 'numeric',
      //   month: 'long',
      //   day: 'numeric',
      //   hour: '2-digit',
      //   minute: '2-digit',
      // }),
      fecha: formatDatePretty(fechaFinalizacion),
      work_done: ticket.response.work_done,
      diagnosis: ticket.response.diagnosis,
      nombreVerifico: `${ticket.jefe_depto.name} ${ticket.jefe_depto.paternalSurname} ${ticket.jefe_depto.maternalSurname}`,
      firmaVerifico:
        ticket.response.signatures.find(
          (signature) => signature.role === SignatureRole.JEFE_DEPTO,
        )?.signature_hash ?? '',
      fechaVerifico: formatDatePretty(
        ticket.response.signatures.find(
          (signature) => signature.role === SignatureRole.JEFE_DEPTO,
        )?.signed_at,
      ),
      tipoMantenimiento: { nombre: ticket.response.maintenance_type.name },
      tipoServicio: { nombre: ticket.response.service_type.name },
      aprobo: {
        nombreCompleto: `${ticket.response.computing_center_manager.names} ${ticket.response.computing_center_manager.first_last_name} ${ticket.response.computing_center_manager.second_last_name}`,
        fecha: formatDatePretty(fechaFinalizacion),
        firma:
          ticket.response.signatures.find(
            (signature) => signature.role === SignatureRole.JEFE_CC,
          )?.signature_hash ?? '',
      },
      solicitud: {
        coordinationAtencion: `${ticket.coordinator.name} ${ticket.coordinator.paternalSurname} ${ticket.coordinator.maternalSurname}`,
        user: {
          departamento: { nombre: ticket.jefe_depto.department.name },
        },
      },
      viculacion: {
        fecha: formatDatePretty(
          ticket.response.signatures.find(
            (signature) => signature.role === SignatureRole.PLANEACION,
          )?.signed_at,
        ),
        name: '',
        firma:
          ticket.response.signatures.find(
            (signature) => signature.role === SignatureRole.PLANEACION,
          )?.signature_hash ?? '',
      },
    });

    const pdfDoc = this.printerServices.createPdf(docDefinition) as PdfStream;

    // Convertimos el stream a Buffer para poder subirlo
    const pdfBuffer = await this.getPdfBuffer(pdfDoc);

    // Creamos el objeto fakeFile compatible con lo que espera tu FilesService (estilo Multer)
    const folio = ticket.folio;
    const fakeFile = {
      buffer: pdfBuffer,
      originalname: `respuesta-${folio}.pdf`,
      mimetype: 'application/pdf',
      size: pdfBuffer.length,
      fieldname: 'file',
      encoding: '7bit',
      destination: '',
      filename: '',
      path: '',
    };

    // Subimos el archivo al bucket 'pdfs' usando el folio como identificador/carpeta
    const uploadResult = await this.filesService.uploadFile(
      fakeFile,
      'pdfs-response',
      folio.toString(), // Convertimos a string por consistencia
    );

    // Retornamos el resultado de la subida (usualmente la URL o el path del archivo)
    return uploadResult;
  }
}
