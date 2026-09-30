import * as crypto from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DigitalSignatureService {
  constructor(private readonly configService: ConfigService) {}

  generateSignature(
    folio: string,
    rfc: string,
    documentData: string,
    previousHash: string = 'ROOT',
  ) {
    const originalChain = `||${folio}||${rfc}||${documentData}||PREV:${previousHash}||`;

    const signatureHash = crypto
      .createHmac('sha256', this.configService.get('signature_secret_key')!)
      .update(originalChain)
      .digest('hex');

    return { originalChain, signatureHash };
  }
}
