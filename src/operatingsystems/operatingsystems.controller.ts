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
import { OperatingsystemsService } from './operatingsystems.service';
import { CreateOperatingsystemDto } from './dto/create-operatingsystem.dto';
import { UpdateOperatingsystemDto } from './dto/update-operatingsystem.dto';
import { FilterOperatingSystemDto } from './dto/filter-operatingsystem.dto';
// import { Auth } from 'src/auth/decorators/auth.decorator';
// import { ValidRole } from '../auth/interfaces/valid-roles';

@ApiTags('Operating Systems (Sistemas operativos)')
@ApiCookieAuth()
@Controller('operatingsystems')
export class OperatingsystemsController {
  constructor(
    private readonly operatingsystemsService: OperatingsystemsService,
  ) {}

  @Post()
  // @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @ApiOperation({
    summary: 'Registrar un nuevo sistema operativo en el catálogo',
  })
  @ApiCreatedResponse({
    description: 'El sistema operativo ha sido guardado exitosamente.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autorizado. Se requiere token válido.',
  })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  create(@Body() createOperatingsystemDto: CreateOperatingsystemDto) {
    return this.operatingsystemsService.create(createOperatingsystemDto);
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
    summary: 'Obtener la lista de sistemas operativos filtrada y paginada',
  })
  @ApiOkResponse({
    description: 'Retorna los sistemas operativos registrados.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  findAll(@Query() filterDto: FilterOperatingSystemDto) {
    return this.operatingsystemsService.findAll(filterDto);
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
    summary: 'Obtener un sistema operativo específico por su ID',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del sistema operativo a consultar',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'Retorna los datos del sistema operativo encontrado.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.operatingsystemsService.findOne(id);
  }

  @Patch(':id')
  // @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @ApiOperation({
    summary: 'Actualizar los datos de un sistema operativo existente',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID del sistema operativo a modificar',
    type: 'string',
  })
  @ApiOkResponse({
    description: 'El registro ha sido actualizado de forma exitosa.',
  })
  @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  @ApiForbiddenResponse({
    description: 'Acceso denegado. Permisos insuficientes.',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOperatingsystemDto: UpdateOperatingsystemDto,
  ) {
    return this.operatingsystemsService.update(id, updateOperatingsystemDto);
  }

  // @Delete(':id')
  // @Auth(ValidRole.superAdmin)
  // @ApiOperation({ summary: 'Eliminar un sistema operativo del catálogo' })
  // @ApiParam({
  //   name: 'id',
  //   description: 'UUID del sistema operativo a remover',
  //   type: 'string',
  // })
  // @ApiOkResponse({
  //   description: 'El sistema operativo ha sido removido correctamente.',
  // })
  // @ApiUnauthorizedResponse({ description: 'No autorizado.' })
  // @ApiForbiddenResponse({
  //   description: 'Acceso denegado. Requiere rol de superAdmin.',
  // })
  // remove(@Param('id', ParseUUIDPipe) id: string) {
  //   return this.operatingsystemsService.remove(id);
  // }
}
