import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  // Delete,
  Query,
  ParseUUIDPipe,
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
import { ComputerprocessorsService } from './computerprocessors.service';
import { CreateComputerprocessorDto } from './dto/create-computerprocessor.dto';
import { UpdateComputerprocessorDto } from './dto/update-computerprocessor.dto';
import { FilterComputerProcessorDto } from './dto/filter-computerprocessor.dto';
// import { Auth } from 'src/auth/decorators/auth.decorator';
// import { ValidRole } from '../auth/interfaces/valid-roles';

@ApiTags('Computer Processors (Procesador de cómputo)')
@ApiCookieAuth()
@Controller('computerprocessors')
export class ComputerprocessorsController {
  constructor(
    private readonly computerprocessorsService: ComputerprocessorsService,
  ) {}

  @Post()
  // @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @ApiOperation({ summary: 'Registrar un nuevo procesador en el catálogo' })
  @ApiCreatedResponse({
    description: 'El procesador ha sido añadido exitosamente.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Falta el token o ha expirado.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  create(@Body() createComputerprocessorDto: CreateComputerprocessorDto) {
    return this.computerprocessorsService.create(createComputerprocessorDto);
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
    summary: 'Obtener la lista de procesadores filtrada y paginada',
  })
  @ApiOkResponse({
    description: 'Retorna el catálogo de procesadores bajo los filtros dados.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  findAll(@Query() filterDto: FilterComputerProcessorDto) {
    return this.computerprocessorsService.findAll(filterDto);
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
  @ApiOperation({ summary: 'Obtener un procesador específico por su ID' })
  @ApiParam({
    name: 'id',
    description: 'UUID del procesador a buscar',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'Retorna las especificaciones del procesador encontrado.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.computerprocessorsService.findOne(id);
  }

  @Patch(':id')
  // @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @ApiOperation({ summary: 'Actualizar los datos de un procesador existente' })
  @ApiParam({
    name: 'id',
    description: 'UUID del procesador a modificar',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'Los datos del procesador han sido actualizados exitosamente.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateComputerprocessorDto: UpdateComputerprocessorDto,
  ) {
    return this.computerprocessorsService.update(
      id,
      updateComputerprocessorDto,
    );
  }

  // @Delete(':id')
  // @Auth(ValidRole.superAdmin)
  // @ApiOperation({ summary: 'Eliminar un procesador del catálogo' })
  // @ApiParam({
  //   name: 'id',
  //   description: 'UUID del procesador a remover',
  //   type: 'string',
  // })
  // @ApiOkResponse({
  //   description: 'El procesador ha sido eliminado exitosamente.',
  // })
  // @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  // @ApiForbiddenResponse({
  //   description: 'Acceso denegado. Se requiere rol de superAdmin.',
  // })
  // remove(@Param('id', ParseUUIDPipe) id: string) {
  //   return this.computerprocessorsService.remove(id);
  // }
}
