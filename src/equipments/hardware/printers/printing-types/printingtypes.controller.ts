import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  // Delete,
  ParseUUIDPipe,
  Query,
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
import { PrintingtypesService } from './printingtypes.service';
import { CreatePrintingtypeDto } from './dto/create-printingtype.dto';
import { UpdatePrintingtypeDto } from './dto/update-printingtype.dto';
import { FilterPrintingTypeDto } from './dto/filter-printingtype.dto';
// import { Auth } from 'src/auth/decorators/auth.decorator';
// import { ValidRole } from '../auth/interfaces/valid-roles';

@ApiTags('Printing Types (Tipos de impresión)')
@ApiCookieAuth()
@Controller('printingtypes')
export class PrintingtypesController {
  constructor(private readonly printingtypesService: PrintingtypesService) {}

  @Post()
  // @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @ApiOperation({ summary: 'Registrar un nuevo tipo de impresión' })
  @ApiCreatedResponse({
    description: 'El tipo de impresión ha sido creado exitosamente.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Token inválido o expirado.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  create(@Body() createPrintingtypeDto: CreatePrintingtypeDto) {
    return this.printingtypesService.create(createPrintingtypeDto);
  }

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
    summary: 'Obtener el catálogo de tipos de impresión filtrado y paginado',
  })
  @ApiOkResponse({ description: 'Retorna la lista de tipos de impresión.' })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  findAll(@Query() filterDto: FilterPrintingTypeDto) {
    return this.printingtypesService.findAll(filterDto);
  }

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
    summary: 'Obtener un tipo de impresión específico por su ID',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del tipo de impresión a buscar',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'Retorna los datos del tipo de impresión encontrado.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.printingtypesService.findOne(id);
  }

  @Patch(':id')
  // @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @ApiOperation({ summary: 'Actualizar un tipo de impresión existente' })
  @ApiParam({
    name: 'id',
    description: 'UUID del tipo de impresión a actualizar',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'El tipo de impresión ha sido actualizado exitosamente.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePrintingtypeDto: UpdatePrintingtypeDto,
  ) {
    return this.printingtypesService.update(id, updatePrintingtypeDto);
  }

  // @Delete(':id')
  // @Auth(ValidRole.superAdmin)
  // @ApiOperation({ summary: 'Eliminar un tipo de impresión' })
  // @ApiParam({
  //   name: 'id',
  //   description: 'UUID del tipo de impresión a eliminar',
  //   type: 'string',
  // })
  // @ApiOkResponse({
  //   description: 'El tipo de impresión ha sido eliminado de la base de datos.',
  // })
  // @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  // @ApiForbiddenResponse({
  //   description: 'Acceso denegado. Se requiere rol de superAdmin.',
  // })
  // remove(@Param('id', ParseUUIDPipe) id: string) {
  //   return this.printingtypesService.remove(id);
  // }
}
