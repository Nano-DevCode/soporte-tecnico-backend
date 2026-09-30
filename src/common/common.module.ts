import { Module } from '@nestjs/common';
import { DigitalSignatureService } from './service/digital-signature.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [DigitalSignatureService],
  exports: [DigitalSignatureService],
})
export class CommonModule {}
