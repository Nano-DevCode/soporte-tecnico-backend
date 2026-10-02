import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ticket } from '../entities/ticket.entity';
import { UpdateTicketInternalFolioDto } from '../dto/update-ticket-internal-folio.dto';
import { RegeneratePdfDto, DocumentType } from '../dto/regenerate-pdf.dto';
import { PdfsService } from 'src/pdfs/services/pdfs.service';
import { I18nService } from 'nestjs-i18n';
import { TicketDetailsService } from './ticket-details.service';

@Injectable()
export class TicketAdminOpsService {
  private readonly logger = new Logger(TicketAdminOpsService.name);

  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    private readonly ticketDetailsService: TicketDetailsService,
    private readonly responsePdfsService: PdfsService,
    private readonly i18n: I18nService,
  ) {}

  async updateInternalFolio(
    ticketId: string,
    updateTicketInternalFolioDto: UpdateTicketInternalFolioDto,
  ) {
    const ticket = await this.ticketDetailsService.findOneByIdOrFail(ticketId);

    try {
      ticket.internal_folio = updateTicketInternalFolioDto.internal_folio;
      await this.ticketRepository.save(ticket);
    } catch (error) {
      this.logger.error('Error actualizando folio interno:', error);
      const err = error as { code?: string };
      if (err.code === '23505') {
        throw new ConflictException(
          this.i18n.t('errors.tickets.folio_already_exists'),
        );
      }
      throw new ServiceUnavailableException(
        this.i18n.t('errors.database.connection'),
      );
    }

    return ticket;
  }

  async regeneratePdf(ticketId: string, regeneratePdfDto: RegeneratePdfDto) {
    const ticket =
      await this.ticketDetailsService.findAllDetailsByIdOrFail(ticketId);

    try {
      if (regeneratePdfDto.type === DocumentType.REQUEST) {
        return await this.responsePdfsService.pdfRequestBucket(ticket);
      } else if (regeneratePdfDto.type === DocumentType.RESPONSE) {
        if (!ticket.response) {
          throw new NotFoundException(
            this.i18n.t('errors.tickets.no_response_associated'),
          );
        }
        return await this.responsePdfsService.pdfResponseBucket(ticket);
      }
    } catch (error) {
      this.logger.error('Error generando el PDF:', error);

      throw new ServiceUnavailableException(
        this.i18n.t('errors.tickets.pdf_generation_failed'),
      );
    }
  }
}
