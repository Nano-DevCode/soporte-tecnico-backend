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
import { PrinterfunctiontypesService } from './printerfunctiontypes.service';
import { CreatePrinterfunctiontypeDto } from './dto/create-printerfunctiontype.dto';
import { UpdatePrinterfunctiontypeDto } from './dto/update-printerfunctiontype.dto';
import { FilterPrinterFunctionTypeDto } from './dto/filter-printerfunctiontype.dto';
// import { Auth } from 'src/auth/decorators/auth.decorator';
// import { ValidRole } from '../auth/interfaces/valid-roles';

@ApiTags('Printer Function Types (Tipos de función de impresora)')
@ApiCookieAuth()
@Controller('printerfunctiontypes')
export class PrinterfunctiontypesController {
  constructor(
    private readonly printerfunctiontypesService: PrinterfunctiontypesService,
  ) {}

  @Post()
  // @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @ApiOperation({ summary: 'Registrar un nuevo tipo de función de impresora' })
  @ApiCreatedResponse({
    description: 'El tipo de función ha sido creado exitosamente.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Falta token de acceso.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  create(@Body() createPrinterfunctiontypeDto: CreatePrinterfunctiontypeDto) {
    return this.printerfunctiontypesService.create(
      createPrinterfunctiontypeDto,
    );
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
    summary: 'Obtener el catálogo de tipos de función filtrado y paginado',
  })
  @ApiOkResponse({
    description: 'Retorna la lista de tipos de función mapeados.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  findAll(@Query() filterDto: FilterPrinterFunctionTypeDto) {
    return this.printerfunctiontypesService.findAll(filterDto);
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
    summary: 'Obtener un tipo de función específico mediante su ID',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del tipo de función a buscar',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'Retorna los datos del tipo de función encontrado.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.printerfunctiontypesService.findOne(id);
  }

  @Patch(':id')
  // @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @ApiOperation({ summary: 'Actualizar un tipo de función existente' })
  @ApiParam({
    name: 'id',
    description: 'UUID del tipo de función a modificar',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'El tipo de función ha sido modificado exitosamente.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePrinterfunctiontypeDto: UpdatePrinterfunctiontypeDto,
  ) {
    return this.printerfunctiontypesService.update(
      id,
      updatePrinterfunctiontypeDto,
    );
  }

  // @Delete(':id')
  // @Auth(ValidRole.superAdmin)
  // @ApiOperation({ summary: 'Eliminar un tipo de función' })
  // @ApiParam({
  //   name: 'id',
  //   description: 'UUID del tipo de función a eliminar',
  //   type: 'string',
  // })
  // @ApiOkResponse({
  //   description: 'El tipo de función ha sido eliminado exitosamente.',
  // })
  // @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  // @ApiForbiddenResponse({
  //   description: 'Acceso denegado. Se requiere el rol de superAdmin.',
  // })
  // remove(@Param('id', ParseUUIDPipe) id: string) {
  //   return this.printerfunctiontypesService.remove(id);
  // }
}
