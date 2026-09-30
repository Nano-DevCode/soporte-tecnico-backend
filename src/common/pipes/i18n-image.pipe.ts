import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { I18nContext } from 'nestjs-i18n';
import { MulterFile } from 'src/files/files.service'; // Ajusta la ruta si es necesario

@Injectable()
export class I18nImagePipe implements PipeTransform {
  // Recibimos un booleano para saber si el archivo es obligatorio o no
  constructor(private readonly isRequired: boolean = true) {}

  transform(file?: MulterFile) {
    const i18n = I18nContext.current();
    const i18nFileName = 'validation';
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB convertidos a bytes

    // 1. Validamos si es requerido
    if (this.isRequired && !file) {
      throw new BadRequestException(
        i18n?.t(`${i18nFileName}.isNotEmpty`, {
          args: { property: 'imagen' },
        }),
      );
    }

    // 2. Si hay archivo, validamos tamaño y extensión
    if (file) {
      // Validar tamaño máximo (5MB)
      if (file.size > MAX_FILE_SIZE) {
        throw new BadRequestException(
          i18n?.t(`${i18nFileName}.maxSize`, {
            args: { property: 'imagen', size: '5MB' },
          }) ?? 'El archivo debe de ser menor a 5MB',
        );
      }

      // Expresión regular para validar el tipo de archivo
      const allowedMimeTypes = /image\/(png|jpeg|jpg|webp)/i;
      if (!allowedMimeTypes.test(file.mimetype)) {
        throw new BadRequestException(
          i18n?.t(`${i18nFileName}.isMimeType`, {
            args: { property: 'imagen' },
          }),
        );
      }
    }

    // Si pasa todas las validaciones, retornamos el archivo limpio
    return file;
  }
}
