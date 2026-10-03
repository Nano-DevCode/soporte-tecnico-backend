import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  HttpCode,
} from '@nestjs/common';
import { ToolsService } from '../services/tools.service';
import { CreateToolDto } from '../dto/create-tool.dto';
import { UpdateToolDto } from '../dto/update-tool.dto';
import { FilterToolDto } from '../dto/filter-tool.dto';
import { ChangeStatusToolDto } from '../dto/change-status-tool.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRole } from 'src/auth/interfaces/valid-roles';
import { FileInterceptor } from '@nestjs/platform-express';
import { type MulterFile } from 'src/files/files.service';
import { FindByIdsDto } from '../dto/find-by-ids.dto';
import { I18nImagePipe } from 'src/common/pipes/i18n-image.pipe';
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

@ApiTags('Tools (Herramientas)')
@ApiCookieAuth()
@ApiExtraModels(CreateToolDto, UpdateToolDto)
@Controller('tools')
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  @Post('by-ids')
  @HttpCode(200)
  @Auth(
    ValidRole.superAdmin,
    ValidRole.coordinador,
    ValidRole.tecnico,
    ValidRole.jefecc,
  )
  @ApiOperation({
    summary:
      'Obtener un listado de herramientas específicas enviando un arreglo de UUIDs',
  })
  @ApiOkResponse({ description: 'Retorna las herramientas solicitadas.' })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  findByIds(@Body() findByIdsDto: FindByIdsDto) {
    return this.toolsService.findByIds(findByIdsDto);
  }

  @Post()
  @Auth(
    ValidRole.coordinador,
    ValidRole.inventory,
    ValidRole.jefecc,
    ValidRole.superAdmin,
  )
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Registrar una nueva herramienta junto con su imagen',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Datos de la herramienta y archivo de imagen adjunto',
    schema: {
      allOf: [
        { $ref: getSchemaPath(CreateToolDto) },
        {
          properties: {
            file: {
              type: 'string',
              format: 'binary',
              description: 'Imagen de la herramienta (jpg, png, webp)',
            },
          },
        },
      ],
    },
  })
  @ApiCreatedResponse({
    description: 'La herramienta ha sido registrada exitosamente.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  create(
    @Body() createToolDto: CreateToolDto,
    @UploadedFile(new I18nImagePipe(false)) file: MulterFile,
  ) {
    return this.toolsService.create(createToolDto, file);
  }

  @Get()
  @Auth(
    ValidRole.coordinador,
    ValidRole.inventory,
    ValidRole.jefecc,
    ValidRole.superAdmin,
    ValidRole.visitor,
    ValidRole.secretaria,
  )
  @ApiOperation({
    summary: 'Obtener la lista de herramientas con filtros y paginación',
  })
  @ApiOkResponse({
    description: 'Retorna las herramientas que coinciden con los criterios.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({ description: 'Acceso denegado.' })
  findAll(@Query() filterDto: FilterToolDto) {
    return this.toolsService.findAll(filterDto);
  }

  @Get(':id')
  @Auth(
    ValidRole.coordinador,
    ValidRole.inventory,
    ValidRole.jefecc,
    ValidRole.superAdmin,
    ValidRole.visitor,
    ValidRole.secretaria,
  )
  @ApiOperation({
    summary: 'Obtener los detalles completos de una herramienta específica',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la herramienta',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'Retorna toda la información de la herramienta.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({ description: 'Acceso denegado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.toolsService.findOne(id);
  }

  @Patch('change-status/:id')
  @Auth(
    ValidRole.coordinador,
    ValidRole.inventory,
    ValidRole.jefecc,
    ValidRole.superAdmin,
  )
  @ApiOperation({
    summary: 'Cambiar el estado lógico (activo/inactivo) de una herramienta',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la herramienta a modificar',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'El estado ha sido actualizado correctamente.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({ description: 'Acceso denegado.' })
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() changeStatusDto: ChangeStatusToolDto,
  ) {
    return this.toolsService.changeStatus(id, changeStatusDto);
  }

  @Patch(':id')
  @Auth(
    ValidRole.coordinador,
    ValidRole.inventory,
    ValidRole.jefecc,
    ValidRole.superAdmin,
  )
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Actualizar los datos de una herramienta y/o reemplazar su imagen',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID de la herramienta a actualizar',
    type: 'string',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Datos a actualizar y nueva imagen (opcional)',
    schema: {
      allOf: [
        { $ref: getSchemaPath(UpdateToolDto) },
        {
          properties: {
            file: {
              type: 'string',
              format: 'binary',
              description: 'Nueva imagen de la herramienta (opcional)',
            },
          },
        },
      ],
    },
  })
  @ApiOkResponse({
    description: 'La herramienta ha sido actualizada exitosamente.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({ description: 'Acceso denegado.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateToolDto: UpdateToolDto,
    @UploadedFile(new I18nImagePipe(false)) file: MulterFile,
  ) {
    return this.toolsService.update(id, updateToolDto, file);
  }
}
