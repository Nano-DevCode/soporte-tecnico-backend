import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiProduces,
  ApiCookieAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { PdfsService } from '../services/pdfs.service';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRole } from 'src/auth/interfaces/valid-roles';

@ApiTags('PDFs')
@ApiCookieAuth()
@Controller(['pdfs', 'response-pdfs'])
export class PdfsController {
  constructor(private readonly pdfsService: PdfsService) {}

  @Get('request')
  @Auth(
    ValidRole.coordinador,
    ValidRole.jefecc,
    ValidRole.superAdmin,
    ValidRole.tecnico,
  )
  @ApiOperation({
    summary: 'Generar vista previa de plantilla PDF de Solicitud de Servicio',
  })
  @ApiProduces('application/pdf')
  @ApiOkResponse({
    description: 'Stream binario del archivo PDF de solicitud generado.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Se requiere sesión activa.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  pdfRequest(@Res() response: Response): void {
    const pdfDoc = this.pdfsService.pdfRequest();
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'inline; filename="solicitud-servicio-preview.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }

  @Get('response')
  @Auth(
    ValidRole.coordinador,
    ValidRole.jefecc,
    ValidRole.superAdmin,
    ValidRole.tecnico,
  )
  @ApiOperation({
    summary:
      'Generar vista previa de plantilla PDF de Respuesta y Cierre de Ticket',
  })
  @ApiProduces('application/pdf')
  @ApiOkResponse({
    description: 'Stream binario del archivo PDF de respuesta generado.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Se requiere sesión activa.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  pdfResponse(@Res() response: Response): void {
    const pdfDoc = this.pdfsService.pdfResponse();
    response.setHeader('Content-Type', 'application/pdf');
    response.setHeader(
      'Content-Disposition',
      'inline; filename="respuesta-ticket-preview.pdf"',
    );
    pdfDoc.pipe(response);
    pdfDoc.end();
  }
}

// Alias para mantener compatibilidad con consumidores existentes
export { PdfsController as ResponsePdfsController };

