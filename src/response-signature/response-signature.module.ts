import { Module } from '@nestjs/common';
import { ResponseSignatureService } from './response-signature.service';
import { ResponseSignatureController } from './response-signature.controller';
import { CommonModule } from '../common/common.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResponseSignature } from './entities/response-signature.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ResponseSignature]), CommonModule],
  controllers: [ResponseSignatureController],
  providers: [ResponseSignatureService],
  exports: [ResponseSignatureService],
})
export class ResponseSignatureModule {}
