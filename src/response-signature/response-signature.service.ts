import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import {
  ResponseSignature,
  SignatureRole,
} from './entities/response-signature.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Response } from 'src/responses/entities/response.entity';
import { DigitalSignatureService } from 'src/common/service/digital-signature.service';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class ResponseSignatureService {
  constructor(
    @InjectRepository(ResponseSignature)
    private readonly responseSignatureRepository: Repository<ResponseSignature>,
    private readonly digitalSignatureService: DigitalSignatureService,
    private readonly i18n: I18nService,
  ) {}

  async signResponse(
    response: Response,
    rfc: string,
    roleToSign: SignatureRole,
    transactionManager: EntityManager,
  ) {
    const currentSignatures = response.signatures || [];
    const hasJefeCC = currentSignatures.some(
      (sig) => sig.role === SignatureRole.JEFE_CC,
    );
    const hasJefeDepto = currentSignatures.some(
      (sig) => sig.role === SignatureRole.JEFE_DEPTO,
    );

    if (roleToSign === SignatureRole.JEFE_CC && hasJefeCC) {
      throw new ConflictException(
        this.i18n.t('errors.signatures.jefe_cc_already_signed'),
      );
    }

    if (roleToSign === SignatureRole.JEFE_DEPTO && !hasJefeCC) {
      throw new ConflictException(
        this.i18n.t('errors.signatures.requires_jefe_cc_signature'),
      );
    }

    if (
      roleToSign === SignatureRole.PLANEACION &&
      (!hasJefeCC || !hasJefeDepto)
    ) {
      throw new ConflictException(
        this.i18n.t('errors.signatures.requires_both_signatures_for_planning'),
      );
    }
    const previousHash =
      currentSignatures.length > 0
        ? currentSignatures[currentSignatures.length - 1].signature_hash
        : 'ROOT';
    const manager =
      transactionManager || this.responseSignatureRepository.manager;

    if (!response.ticket?.folio || !response.ticket?.internal_folio) {
      throw new BadRequestException(
        this.i18n.t('errors.signatures.missing_ticket_data'),
      );
    }

    if (!response.maintenance_type?.name || !response.service_type?.id) {
      throw new BadRequestException(
        this.i18n.t('errors.signatures.missing_response_data'),
      );
    }

    const documentData = [
      response.id,
      Math.floor(response.created_at.getTime() / 1000).toString(),
      response.diagnosis,
      response.work_done,
      response.maintenance_type.name,
      response.service_type.id,
      response.ticket.folio,
    ].join('||');

    const { originalChain, signatureHash } =
      this.digitalSignatureService.generateSignature(
        response.ticket.internal_folio,
        rfc,
        documentData,
        previousHash,
      );

    const newSignature = manager.create(ResponseSignature, {
      response: { id: response.id },
      role: roleToSign,
      original_chain: originalChain,
      signature_hash: signatureHash,
    });

    return await manager.save(newSignature);
  }
}
