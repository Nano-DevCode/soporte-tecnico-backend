import { forwardRef, Module } from '@nestjs/common';
import { ResponsesService } from './responses.service';
import { ResponsesController } from './responses.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Response } from './entities/response.entity';
import { ComputingCenterManagerModule } from 'src/computing-center-manager/computing-center-manager.module';
import { CommonModule } from 'src/common/common.module';
import { ResponseSignatureModule } from 'src/response-signature/response-signature.module';
import { TicketsModule } from 'src/tickets/tickets.module';
import { PdfsModule } from 'src/pdfs/pdfs.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Response]),
    ComputingCenterManagerModule,
    CommonModule,
    ResponseSignatureModule,
    forwardRef(() => TicketsModule),
    PdfsModule,
  ],
  controllers: [ResponsesController],
  providers: [ResponsesService],
  exports: [ResponsesService],
})
export class ResponsesModule {}
