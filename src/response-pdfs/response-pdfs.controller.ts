import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ResponsePdfsService } from './response-pdfs.service';

@Controller('response-pdfs')
export class ResponsePdfsController {
  constructor(private readonly responsePdfsService: ResponsePdfsService) {}

  @Get('request')
  pdfRequest(@Res() response: Response) {
    const pdfDoc = this.responsePdfsService.pdfRequest();
    response.setHeader('Content-Type', 'application/pdf');
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  @Get('response')
  pdfResponse(@Res() response: Response) {
    const pdfDoc = this.responsePdfsService.pdfResponse();
    response.setHeader('Content-Type', 'application/pdf');
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  //@Get('prueba')
  //pdfResponseBucket() {
  //  return this.responsePdfsService.pdfRequestBucket('SoyLaVergaParada.pdf');
  //}
}
