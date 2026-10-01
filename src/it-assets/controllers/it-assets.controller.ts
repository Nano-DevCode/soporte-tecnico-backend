import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ItAssetsService } from '../services/it-assets.service';
import { CreateItAssetDto } from '../dto/create-it-asset.dto';
import { UpdateItAssetDto } from '../dto/update-it-asset.dto';
import { FilterItAssetBrandDto } from '../dto/filter-it-asset.dto';
import { type MulterFile } from 'src/files/files.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChangeStatusItAssetDto } from '../dto/change-status-it-asset.dto';
import { I18nImagePipe } from 'src/common/pipes/i18n-image.pipe';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRole } from 'src/auth/interfaces/valid-roles';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiParam,
  getSchemaPath,
  ApiExtraModels,
  ApiCookieAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';

@ApiTags('IT Assets (Activos TI)')
@ApiCookieAuth()
@ApiExtraModels(CreateItAssetDto, UpdateItAssetDto)
@Controller('it-assets')
export class ItAssetsController {
  constructor(private readonly itAssetsService: ItAssetsService) {}

  @Post()
  @Auth(
    ValidRole.coordinador,
    ValidRole.jefecc,
    ValidRole.inventory,
    ValidRole.superAdmin,
  )
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Crear un nuevo activo TI junto con su imagen' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Datos del activo TI y archivo de imagen adjunto',
    schema: {
      allOf: [
        { $ref: getSchemaPath(CreateItAssetDto) },
        {
          properties: {
            file: {
              type: 'string',
              format: 'binary',
              description: 'Imagen del equipo (jpg, png, webp)',
            },
          },
        },
      ],
    },
  })
  @ApiCreatedResponse({
    description: 'El activo TI ha sido creado exitosamente.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Falta el token o ha expirado.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  create(
    @Body() createItAssetDto: CreateItAssetDto,
    @UploadedFile(new I18nImagePipe(false)) file: MulterFile,
  ) {
    return this.itAssetsService.create(createItAssetDto, file);
  }

  @Get()
  @Auth(
    ValidRole.coordinador,
    ValidRole.jefecc,
    ValidRole.tecnico,
    ValidRole.inventory,
    ValidRole.superAdmin,
    ValidRole.visitor,
    ValidRole.secretaria,
  )
  @ApiOperation({
    summary: 'Obtener la lista de activos TI con filtros y paginación',
  })
  @ApiOkResponse({
    description:
      'Retorna los activos TI que coinciden con los criterios de búsqueda.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  findAll(@Query() filterDto: FilterItAssetBrandDto) {
    return this.itAssetsService.findAll(filterDto);
  }

  @Get(':id')
  @Auth(
    ValidRole.coordinador,
    ValidRole.jefecc,
    ValidRole.tecnico,
    ValidRole.inventory,
    ValidRole.superAdmin,
    ValidRole.visitor,
    ValidRole.secretaria,
  )
  @ApiOperation({
    summary: 'Obtener los detalles completos de un activo TI específico',
  })
  @ApiParam({ name: 'id', description: 'UUID del activo TI', type: 'string' })
  @ApiOkResponse({
    description: 'Retorna toda la información del activo encontrado.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  findOne(@Param('id') id: string) {
    return this.itAssetsService.findOne(id);
  }

  @Patch('change-status/:id')
  @Auth(
    ValidRole.coordinador,
    ValidRole.jefecc,
    ValidRole.tecnico,
    ValidRole.inventory,
    ValidRole.superAdmin,
  )
  @ApiOperation({
    summary: 'Cambiar el estado lógico (activo/inactivo) de un activo TI',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del activo TI a modificar',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'El estado del activo ha sido actualizado correctamente.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  changeStatus(
    @Param('id') id: string,
    @Body() changeStatusItAssetDto: ChangeStatusItAssetDto,
  ) {
    return this.itAssetsService.changeStatus(id, changeStatusItAssetDto);
  }

  @Patch(':id')
  @Auth(
    ValidRole.coordinador,
    ValidRole.jefecc,
    ValidRole.tecnico,
    ValidRole.inventory,
    ValidRole.superAdmin,
  )
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Actualizar los datos de un activo TI y/o reemplazar su imagen',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del activo TI a actualizar',
    type: 'string',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Datos a actualizar y nueva imagen (opcional)',
    schema: {
      allOf: [
        { $ref: getSchemaPath(UpdateItAssetDto) },
        {
          properties: {
            file: {
              type: 'string',
              format: 'binary',
              description: 'Nueva imagen del equipo (opcional)',
            },
          },
        },
      ],
    },
  })
  @ApiOkResponse({
    description: 'El activo TI ha sido actualizado exitosamente.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  update(
    @Param('id') id: string,
    @Body() updateItAssetDto: UpdateItAssetDto,
    @UploadedFile(new I18nImagePipe(false)) file?: MulterFile,
  ) {
    return this.itAssetsService.update(id, updateItAssetDto, file);
  }
}

