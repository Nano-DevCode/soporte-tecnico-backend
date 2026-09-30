import { Controller } from '@nestjs/common';
import { ResponseSignatureService } from './response-signature.service';

@Controller('response-signature')
export class ResponseSignatureController {
  constructor(
    private readonly responseSignatureService: ResponseSignatureService,
  ) {}
}
