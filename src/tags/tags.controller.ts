import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseFilters,
  Query,
} from '@nestjs/common';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { DbexceptionFilter } from 'src/common/filters/dbexception/dbexception.filter';
import { PaginationWithPageDto } from 'src/common/dtos/paginationWithPage.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import {
  ApiTags,
  ApiCookieAuth,
  ApiOperation,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiOkResponse,
  ApiParam,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@ApiTags('Tags')
@ApiCookieAuth()
@UseFilters(DbexceptionFilter)
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @Auth()
  @ApiOperation({ summary: 'Crear una nueva etiqueta' })
  @ApiCreatedResponse({
    description: 'La etiqueta ha sido creada exitosamente.',
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos enviados en el body.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Falta token de acceso.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  create(@Body() createTagDto: CreateTagDto) {
    return this.tagsService.create(createTagDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las etiquetas' })
  @ApiOkResponse({
    description: 'Retorna la lista paginada de etiquetas registradas.',
  })
  findAll(@Query() paginationWithPageDto: PaginationWithPageDto) {
    return this.tagsService.findAll(paginationWithPageDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una etiqueta por ID' })
  @ApiParam({ name: 'id', description: 'ID numérico de la etiqueta' })
  @ApiOkResponse({
    description: 'Detalle de la etiqueta obtenida correctamente.',
  })
  @ApiNotFoundResponse({ description: 'Etiqueta no encontrada.' })
  findOne(@Param('id') id: string) {
    return this.tagsService.findOne(+id);
  }
}
