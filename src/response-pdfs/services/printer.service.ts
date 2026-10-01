import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import PdfPrinter from 'pdfmake';
import { BufferOptions, TDocumentDefinitions } from 'pdfmake/interfaces';

@Injectable()
export class PrinterService {
  private printer: PdfPrinter;

  constructor(private readonly configService: ConfigService) {
    const isProd =
      this.configService.get<string>('environment') === 'production';

    const baseFontsPath = isProd
      ? path.join(process.cwd(), 'dist', 'assets', 'fonts')
      : path.join(process.cwd(), 'src', 'assets', 'fonts');

    const fonts = {
      Roboto: {
        normal: path.join(baseFontsPath, 'Roboto-Regular.ttf'),
        bold: path.join(baseFontsPath, 'Roboto-Medium.ttf'),
        italics: path.join(baseFontsPath, 'Roboto-Italic.ttf'),
        bolditalics: path.join(baseFontsPath, 'Roboto-MediumItalic.ttf'),
      },
    };

    this.printer = new PdfPrinter(fonts);
  }

  createPdf(
    docDefinition: TDocumentDefinitions,
    options: BufferOptions = {},
  ): PDFKit.PDFDocument {
    return this.printer.createPdfKitDocument(docDefinition, options);
  }
}
