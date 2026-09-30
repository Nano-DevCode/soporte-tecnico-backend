import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  // Delete,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiCookieAuth,
  ApiParam,
} from '@nestjs/swagger';
import { TypeconsumablesService } from './typeconsumables.service';
import { CreateTypeconsumableDto } from './dto/create-typeconsumable.dto';
import { UpdateTypeconsumableDto } from './dto/update-typeconsumable.dto';
import { FilterTypeconsumableDto } from './dto/filter-typeconsumable.dto';
import { Typeconsumable } from './entities/typeconsumable.entity';
// import { Auth } from 'src/auth/decorators/auth.decorator';
// import { ValidRole } from 'src/auth/interfaces/valid-roles';

@ApiTags('Type Consumables (Tipo de consumible)')
@ApiCookieAuth()
@Controller('type-consumables')
export class TypeconsumablesController {
  constructor(
    private readonly typeconsumablesService: TypeconsumablesService,
  ) {}

  // --- CREAR TIPO ---
  @Post()
  // @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar un nuevo tipo o categoría raíz de consumible',
  })
  @ApiCreatedResponse({
    description: 'La categoría de insumo ha sido guardada de forma exitosa.',
    type: Typeconsumable,
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Se requiere token de sesión válido.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos de escritura insuficientes.',
  })
  create(
    @Body() createTypeconsumableDto: CreateTypeconsumableDto,
  ): Promise<Typeconsumable> {
    return this.typeconsumablesService.create(createTypeconsumableDto);
  }

  // --- LISTAR TODOS CON FILTRO Y PAGINACIÓN ---
  @Get()
  // @Auth(
  //   ValidRole.superAdmin,
  //   ValidRole.jefe,
  //   ValidRole.coordinador,
  //   ValidRole.inventory,
  //   ValidRole.jefecc,
  //   ValidRole.secretaria,
  //   ValidRole.tecnico,
  // )
  @ApiOperation({
    summary:
      'Obtener el catálogo de tipos de consumibles con filtros y paginación',
  })
  @ApiOkResponse({
    description:
      'Retorna la lista de tipos de insumo según los criterios de búsqueda.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  findAll(@Query() filterTypeconsumableDto: FilterTypeconsumableDto) {
    return this.typeconsumablesService.findAll(filterTypeconsumableDto);
  }

  // --- OBTENER UNO POR ID ---
  @Get(':id')
  // @Auth(
  //   ValidRole.superAdmin,
  //   ValidRole.jefecc,
  //   ValidRole.coordinador,
  //   ValidRole.inventory,
  //   ValidRole.secretaria,
  //   ValidRole.tecnico,
  // )
  @ApiOperation({
    summary: 'Obtener los detalles de un tipo de consumible por su ID numérico',
  })
  @ApiParam({
    name: 'id',
    description: 'ID numérico autoincremental de la categoría',
    type: 'number',
    example: 1,
  })
  @ApiOkResponse({
    description: 'Retorna la información del tipo de consumible solicitado.',
    type: Typeconsumable,
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Typeconsumable> {
    return this.typeconsumablesService.findOne(id);
  }

  // --- MODIFICAR TIPO ---
  @Patch(':id')
  // @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @ApiOperation({ summary: 'Actualizar un tipo de consumible existente' })
  @ApiParam({
    name: 'id',
    description: 'ID numérico de la categoría a modificar',
    type: 'number',
    example: 1,
  })
  @ApiOkResponse({
    description: 'El tipo de consumible ha sido modificado y actualizado.',
    type: Typeconsumable,
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTypeconsumableDto: UpdateTypeconsumableDto,
  ): Promise<Typeconsumable> {
    return this.typeconsumablesService.update(id, updateTypeconsumableDto);
  }

  // --- ELIMINAR TIPO ---
  // @Delete(':id')
  // @Auth(ValidRole.superAdmin)
  // @ApiOperation({ summary: 'Eliminar un tipo de consumible del catálogo' })
  // @ApiParam({
  //   name: 'id',
  //   description: 'ID numérico del registro a remover',
  //   type: 'number',
  //   example: 1,
  // })
  // @ApiOkResponse({
  //   description:
  //     'La categoría de consumible ha sido eliminada correctamente del repositorio.',
  // })
  // @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  // @ApiForbiddenResponse({
  //   description: 'Acceso denegado. Se requiere rol de superAdmin.',
  // })
  // remove(@Param('id', ParseIntPipe) id: number) {
  //   return this.typeconsumablesService.remove(id);
  // }
}
