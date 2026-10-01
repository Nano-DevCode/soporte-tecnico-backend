import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateResponseDto } from './dto/create-response.dto';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Response } from './entities/response.entity';
import { ComputingCenterManagerService } from 'src/computing-center-manager/computing-center-manager.service';
import { ResponseSignatureService } from 'src/response-signature/response-signature.service';
import { SignatureRole } from 'src/response-signature/entities/response-signature.entity';
import { UpdateResponseDto } from './dto/update-response.dto';
import { TicketsService } from 'src/tickets/services';
import { PdfsService } from 'src/pdfs/services/pdfs.service';
import { Document } from 'src/documents/entities/document.entity';

@Injectable()
export class ResponsesService {
  constructor(
    @InjectRepository(Response)
    private readonly responseRepository: Repository<Response>,
    private readonly computingCenterManagerService: ComputingCenterManagerService,
    private readonly responseSignatureService: ResponseSignatureService,
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => TicketsService))
    private readonly ticketsService: TicketsService,
    private readonly responsePdfsService: PdfsService,
  ) {}

  async create(
    createResponseDto: CreateResponseDto,
    transactionManager?: EntityManager,
  ) {
    const {
      ticket_id,
      maintenance_type_id,
      service_type_id,
      ...restResponseDto
    } = createResponseDto;
    const manager = transactionManager || this.responseRepository.manager;
    const computingManager =
      await this.computingCenterManagerService.getActiveManagerOrFail(
        transactionManager,
      );
    const response = manager.create(Response, {
      ...restResponseDto,
      ticket: { id: ticket_id },
      maintenance_type: { id: maintenance_type_id },
      service_type: { id: service_type_id },
      computing_center_manager: computingManager,
    });
    await manager.save(response);

    const responseWithSignatures = await manager.findOneOrFail(Response, {
      where: { id: response.id },
      relations: ['signatures', 'ticket', 'maintenance_type', 'service_type'],
      order: {
        signatures: {
          signed_at: 'ASC',
        },
      },
    });

    await this.responseSignatureService.signResponse(
      responseWithSignatures,
      computingManager.rfc,
      SignatureRole.JEFE_CC,
      manager,
    );

    return responseWithSignatures;
  }

  async findByTicketIdOrFail(ticketId: string, manager?: EntityManager) {
    const repo = manager || this.responseRepository.manager;
    return await repo.findOneOrFail(Response, {
      where: { ticket: { id: ticketId } },
      relations: ['signatures', 'ticket', 'maintenance_type', 'service_type'],
      order: { signatures: { signed_at: 'ASC' } },
    });
  }

  async update(ticketId: string, updateDto: UpdateResponseDto) {
    const existingResponse = await this.responseRepository.findOne({
      where: { ticket: { id: ticketId } },
      relations: ['ticket'],
    });

    if (!existingResponse) {
      throw new NotFoundException(
        `Orden de trabajo con id ${ticketId} no encontrada`,
      );
    }

    return await this.dataSource.transaction(async (transactionManager) => {
      const updatedResponse = transactionManager.merge(
        Response,
        existingResponse,
        updateDto,
      );
      await transactionManager.save(Response, updatedResponse);

      const ticketCompleted =
        await this.ticketsService.findAllDetailsByIdOrFail(
          existingResponse.ticket.id,
          transactionManager,
        );

      const pdfResult =
        await this.responsePdfsService.pdfResponseBucket(ticketCompleted);

      const existingDocument = await transactionManager.findOne(Document, {
        where: {
          ticket: { id: ticketCompleted.id },
          type_document: { id: 2 },
        },
      });

      if (existingDocument) {
        existingDocument.name = pdfResult.fileName;
        existingDocument.url = pdfResult.url;
        await transactionManager.save(Document, existingDocument);
      } else {
        const newDocument = transactionManager.create(Document, {
          name: pdfResult.fileName,
          url: pdfResult.url,
          ticket: ticketCompleted,
          type_document: { id: 2 },
        });
        await transactionManager.save(Document, newDocument);
      }

      return this.findDetailsByTicketIdOrFail(ticketId);
    });
  }

  async findDetailsByTicketIdOrFail(ticketId: string) {
    const response = await this.responseRepository.findOne({
      where: { ticket: { id: ticketId } },
      relations: [
        'ticket',
        'maintenance_type',
        'service_type',
        'ticket.documents.type_document',
      ],
    });
    if (!response) {
      throw new NotFoundException(`Orden de trabajo no encontrada`);
    }
    return response;
  }
}
