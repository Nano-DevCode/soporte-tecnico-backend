import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiCookieAuth,
  ApiConsumes,
  ApiParam,
} from '@nestjs/swagger';
import { ConsumablesService } from './consumables.service';
import { CreateConsumableDto } from './dto/create-consumable.dto';
import { UpdateConsumableDto } from './dto/update-consumable.dto';
import { FilterConsumableDto } from './dto/filter-consumable.dto';
import { Consumable } from './entities/consumable.entity';
import { type MulterFile } from 'src/files/files.service';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRole } from 'src/auth/interfaces/valid-roles';
import { I18nImagePipe } from 'src/common/pipes/i18n-image.pipe';

@ApiTags('Consumables (Consumibles)')
@ApiCookieAuth()
@Controller('consumables')
export class ConsumablesController {
  constructor(private readonly consumablesService: ConsumablesService) {}

  // --- CREAR CONSUMIBLE ---
  @Post()
  @Auth(
    ValidRole.superAdmin,
    ValidRole.inventory,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.secretaria,
  )
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Registrar un nuevo consumible físico con una fotografía adjunta',
  })
  @ApiCreatedResponse({
    description:
      'El artículo consumible ha sido guardado en el catálogo general.',
    type: Consumable,
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado. Token inválido.' })
  @ApiForbiddenResponse({
    description:
      'Acceso denegado. Permisos de almacén o coordinación requeridos.',
  })
  create(
    @Body() createConsumableDto: CreateConsumableDto,
    @UploadedFile(new I18nImagePipe(false)) file: MulterFile,
  ) {
    return this.consumablesService.create(createConsumableDto, file);
  }

  // --- LISTAR TODOS ---
  @Get()
  @Auth(
    ValidRole.superAdmin,
    ValidRole.inventory,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.secretaria,
    ValidRole.visitor,
  )
  @ApiOperation({
    summary:
      'Obtener la lista global de consumibles con filtros avanzados y paginación',
  })
  @ApiOkResponse({
    description:
      'Retorna el conjunto de consumibles que coinciden con los parámetros estipulados.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  findAll(@Query() filterConsumableDto: FilterConsumableDto) {
    return this.consumablesService.findAll(filterConsumableDto);
  }

  // --- OBTENER UNO ---
  @Get(':id')
  @Auth(
    ValidRole.superAdmin,
    ValidRole.inventory,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.secretaria,
    ValidRole.visitor,
  )
  @ApiOperation({
    summary:
      'Consultar la ficha de información detallada de un consumible por su ID',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del consumible a consultar',
    type: 'string',
  })
  @ApiOkResponse({
    description:
      'Retorna la entidad completa del consumible con sus relaciones mapeadas.',
    type: Consumable,
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Consumable> {
    return this.consumablesService.findOne(id);
  }

  // --- MODIFICAR CONSUMIBLE --
  @Patch(':id')
  @Auth(
    ValidRole.superAdmin,
    ValidRole.inventory,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.secretaria,
  )
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Modificar los parámetros o refrescar la fotografía de un consumible',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del consumible a actualizar',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'El registro del consumible ha sido actualizado exitosamente.',
    type: Consumable,
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({ description: 'Acceso denegado.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateConsumableDto: UpdateConsumableDto,
    @UploadedFile(new ParseFilePipe({ fileIsRequired: false }))
    file?: MulterFile,
  ): Promise<Consumable> {
    return this.consumablesService.update(id, updateConsumableDto, file);
  }
}
