import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseFilters,
  ParseUUIDPipe,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { DbexceptionFilter } from 'src/common/filters/dbexception/dbexception.filter';
import {
  AssignTechnicsDto,
  CreateTicketDto,
  FinishTicketDto,
  RejectTicketDto,
  RouteTicketDto,
  UpdateTicketDto,
  UpdateTicketInternalFolioDto,
} from './dto';
import {
  AssignTicketService,
  CreateTicketService,
  EditTicketService,
  FinishTicketService,
  InterveneTicketService,
  PauseTicketService,
  RouteTicketService,
  StartTicketService,
  TicketsService,
} from './services';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { RejectTicketService } from './services/reject-ticket.service';
import { InterveneTicketDto } from './dto/intervene-ticket.dto';
import { CloseTicketService } from './services/close-ticket.service';
import { ArchiveTicketService } from './services/archive-ticket.service';
import { RejectionReportsService } from 'src/rejection-reports/rejection-reports.service';
import { TechnicalReportsService } from 'src/technical-reports/technical-reports.service';
import { FilterTicketsDto } from './dto/filter-tickets.dto';
import { FilterTicketsForSelectDto } from './dto/filter-tickets-for-select';
import { CreateTicketOnBehalfDto } from './dto/create-ticket-on-behalf';
import { ResponsesService } from '../responses/responses.service';
import { UpdateResponseDto } from 'src/responses/dto/update-response.dto';
import { IdempotencyInterceptor } from 'src/common/interceptors/idempotency.interceptor';
import { PaginationWithPageDto } from 'src/common/dtos/paginationWithPage.dto';
import { CloseTicketDto } from './dto/close-ticket.dto';
import { RegeneratePdfDto } from './dto/regenerate-pdf.dto';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ValidRole } from 'src/auth/interfaces/valid-roles';

@ApiTags('Tickets')
@ApiCookieAuth()
@Controller('tickets')
@UseFilters(DbexceptionFilter)
export class TicketsController {
  constructor(
    private readonly ticketsService: TicketsService,
    private readonly createTicketService: CreateTicketService,
    private readonly assignTicketService: AssignTicketService,
    private readonly routeTicketService: RouteTicketService,
    private readonly startTicketService: StartTicketService,
    private readonly editTicketService: EditTicketService,
    private readonly rejectTicketService: RejectTicketService,
    private readonly intervenTicketService: InterveneTicketService,
    private readonly pauseTicketService: PauseTicketService,
    private readonly finishTicketService: FinishTicketService,
    private readonly closedTicketService: CloseTicketService,
    private readonly archiveTicketService: ArchiveTicketService,
    private readonly rejectionReportsService: RejectionReportsService,
    private readonly technicalReportsService: TechnicalReportsService,
    private readonly responsesService: ResponsesService,
  ) {}

  @ApiOperation({
    summary: 'Crear un nuevo ticket',
    description:
      'Endpoint protegido para la creación de tickets. Permite a usuarios con roles de Jefe o Planning registrar información. Implementa control de idempotencia para prevenir la duplicidad de registros.',
  })
  @ApiBody({
    description: 'Datos requeridos para la creación del ticket.',
  })
  @ApiCreatedResponse({
    description: 'El ticket ha sido creado satisfactoriamente.',
  })
  @ApiBadRequestResponse({
    description:
      'Solicitud inválida. Los datos proporcionados en el cuerpo no cumplen con las validaciones del esquema.',
  })
  @ApiUnauthorizedResponse({
    description:
      'Acceso denegado. El token de autenticación no es válido o no ha sido proporcionado.',
  })
  @ApiForbiddenResponse({
    description:
      'Acceso prohibido. El usuario autenticado no cuenta con el rol necesario (Jefe o Planning).',
  })
  @ApiConflictResponse({
    description:
      'Conflicto de idempotencia. La solicitud fue rechazada porque ya existe una operación idéntica en proceso o procesada.',
  })
  @Post()
  @Auth(ValidRole.jefe, ValidRole.planning)
  @UseInterceptors(IdempotencyInterceptor)
  create(@Body() createTicketDto: CreateTicketDto, @GetUser() user: User) {
    return this.createTicketService.create(createTicketDto, user);
  }

  @ApiOperation({
    summary: 'Crear ticket en nombre de otro usuario',
    description:
      'Endpoint exclusivo para administradores y jefes de centro de costos que permite registrar un ticket delegando la creación. Utiliza un mecanismo de idempotencia para garantizar la integridad de la operación.',
  })
  @ApiBody({
    description:
      'Estructura de datos que contiene la información del ticket y la identidad del usuario en cuyo nombre se realiza la gestión.',
  })
  @ApiCreatedResponse({
    description:
      'El ticket ha sido registrado exitosamente a nombre del usuario especificado.',
  })
  @ApiBadRequestResponse({
    description:
      'El cuerpo de la petición es inválido o falta información obligatoria para el registro en nombre de terceros.',
  })
  @ApiUnauthorizedResponse({
    description: 'La sesión es inválida o el token de acceso ha expirado.',
  })
  @ApiForbiddenResponse({
    description:
      'El usuario autenticado no posee los permisos de SuperAdmin o JefeCC necesarios para realizar esta acción.',
  })
  @ApiConflictResponse({
    description:
      'Error de concurrencia: la solicitud ya ha sido procesada mediante el filtro de idempotencia.',
  })
  @Post('on-behalf')
  @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  @UseInterceptors(IdempotencyInterceptor)
  createOnBehalf(
    @Body() createTicketOnBehalfDto: CreateTicketOnBehalfDto,
    @GetUser() user: User,
  ) {
    return this.createTicketService.createOnBehalf(
      createTicketOnBehalfDto,
      user,
    );
  }

  @ApiOperation({
    summary: 'Regenerar documento PDF',
    description:
      'Regenera el documento PDF de solicitud o respuesta para un ticket específico. Solo accesible para SuperAdmin.',
  })
  @Post(':id/regenerate-pdf')
  @Auth(ValidRole.superAdmin)
  regeneratePdf(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() regeneratePdfDto: RegeneratePdfDto,
  ) {
    return this.ticketsService.regeneratePdf(id, regeneratePdfDto);
  }

  @ApiOperation({
    summary: 'Obtener lista de tickets del usuario',
    description:
      'Recupera un listado de tickets asociados al usuario autenticado. Permite aplicar filtros, paginación y ordenamiento a través de parámetros de consulta.',
  })
  @ApiQuery({
    description:
      'Filtros opcionales para la búsqueda, incluyendo paginación, estados del ticket, rangos de fecha y categorías.',
  })
  @ApiOkResponse({
    description: 'Lista de tickets recuperada exitosamente.',
  })
  @ApiBadRequestResponse({
    description:
      'Los parámetros de filtrado proporcionados no tienen el formato esperado.',
  })
  @ApiUnauthorizedResponse({
    description: 'Sesión no válida o token de autenticación ausente.',
  })
  @ApiForbiddenResponse({
    description:
      'El usuario no tiene permisos para acceder a esta lista de tickets.',
  })
  @Get()
  @Auth(
    ValidRole.superAdmin,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.inventory,
    ValidRole.jefe,
    ValidRole.planning,
    ValidRole.secretaria,
    ValidRole.tecnico,
    ValidRole.visitor,
  )
  findAllForUser(
    @Query() filterTicketsDto: FilterTicketsDto,
    @GetUser() user: User,
  ) {
    return this.ticketsService.findAllForUser(filterTicketsDto, user);
  }

  @ApiOperation({
    summary: 'Obtener tickets actuales del usuario',
    description:
      'Recupera únicamente los tickets que se encuentran activos o en curso para el usuario autenticado. Admite parámetros de filtrado adicionales mediante query params.',
  })
  @ApiQuery({
    description:
      'Parámetros de filtrado para refinar la búsqueda de los tickets activos.',
  })
  @ApiOkResponse({
    description: 'Lista de tickets actuales recuperada exitosamente.',
  })
  @ApiBadRequestResponse({
    description:
      'Los parámetros de consulta enviados son incorrectos o no cumplen con los criterios de validación.',
  })
  @ApiUnauthorizedResponse({
    description: 'No se proporcionó un token válido o la sesión ha caducado.',
  })
  @ApiForbiddenResponse({
    description:
      'Acceso denegado. El usuario no cuenta con los privilegios necesarios para consultar tickets activos.',
  })
  @Get('currents')
  @Auth(
    ValidRole.superAdmin,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.jefe,
    ValidRole.planning,
    ValidRole.secretaria,
    ValidRole.tecnico,
  )
  findCurrentForUser(
    @Query() filterTicketsDto: FilterTicketsDto,
    @GetUser() user: User,
  ) {
    return this.ticketsService.findCurrentForUser(filterTicketsDto, user);
  }

  @ApiOperation({
    summary: 'Obtener tickets cerrados y archivados',
    description:
      'Recupera una lista paginada de todos los tickets a nivel global que se encuentran exclusivamente en estado CERRADA o ARCHIVADA. Diseñado para el departamento de Planeación y roles administrativos. Ignora cualquier otro filtro de estado.',
  })
  @ApiOkResponse({
    description:
      'Lista paginada de tickets cerrados y archivados obtenida con éxito.',
  })
  @ApiUnauthorizedResponse({
    description: 'Falta el token de autenticación o es inválido.',
  })
  @ApiForbiddenResponse({
    description:
      'El usuario no tiene los permisos necesarios. Roles permitidos: SuperAdmin, Jefe CC, Planeación, Secretaria CC.',
  })
  @Get('closed-archived')
  @Auth(
    ValidRole.superAdmin,
    ValidRole.jefecc,
    ValidRole.planning,
    ValidRole.secretaria,
  )
  findAllClosedAndArchived(@Query() filterTicketsDto: FilterTicketsDto) {
    return this.ticketsService.findAllClosedAndArchived(filterTicketsDto);
  }

  @ApiOperation({
    summary: 'Obtener todos los tickets de forma paginada',
    description:
      'Endpoint que permite listar la totalidad de los tickets registrados en el sistema utilizando paginación. Accesible para usuarios autenticados.',
  })
  @ApiQuery({
    description:
      'Parámetros de paginación, incluyendo el número de página actual y el límite de registros por página.',
  })
  @ApiOkResponse({
    description: 'Listado paginado de tickets recuperado exitosamente.',
  })
  @ApiBadRequestResponse({
    description:
      'Los parámetros de paginación son inválidos o están fuera de rango.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticación faltante o expirado.',
  })
  @ApiForbiddenResponse({
    description:
      'El usuario no posee permisos suficientes para acceder a este listado global.',
  })
  @Get('all/paginated')
  @Auth()
  findAllPaginated(@Query() paginationWithPageDto: PaginationWithPageDto) {
    return this.ticketsService.findAllPaginated(paginationWithPageDto);
  }

  @ApiOperation({
    summary: 'Obtener tickets para componentes de selección',
    description:
      'Endpoint optimizado para alimentar menús desplegables (selects) o componentes de autocompletado. Filtra los tickets basándose en su estado para facilitar la selección rápida.',
  })
  @ApiQuery({
    description:
      'Filtros aplicados para restringir los tickets devueltos, principalmente el estado requerido para el desplegable.',
  })
  @ApiOkResponse({
    description:
      'Lista de tickets recuperada exitosamente en un formato simplificado para componentes de selección.',
  })
  @ApiBadRequestResponse({
    description: 'Los parámetros de filtrado por estado son inválidos.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticación faltante o no válido.',
  })
  @ApiForbiddenResponse({
    description:
      'El usuario no tiene autorización para acceder a esta información.',
  })
  @Get('options')
  @Auth()
  findAllByStatusForSelect(
    @Query() filterTicketsForSelectDto: FilterTicketsForSelectDto,
  ) {
    return this.ticketsService.findAllByStatusForSelect(
      filterTicketsForSelectDto,
    );
  }

  @ApiOperation({
    summary: 'Obtener detalle de un ticket',
    description:
      'Recupera la información detallada de un ticket específico identificado por su UUID. Incluye todas las relaciones y detalles asociados al registro.',
  })
  @ApiParam({
    name: 'id',
    description:
      'Identificador único (UUID) del ticket que se desea consultar.',
    type: 'string',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Detalle del ticket recuperado exitosamente.',
  })
  @ApiBadRequestResponse({
    description: 'El formato del ID proporcionado no es un UUID válido.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticación faltante o expirado.',
  })
  @ApiForbiddenResponse({
    description: 'El usuario no tiene permisos para visualizar este ticket.',
  })
  @ApiNotFoundResponse({
    description: 'No se encontró un ticket con el ID especificado.',
  })
  @Get(':id')
  @Auth(
    ValidRole.superAdmin,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.jefe,
    ValidRole.planning,
    ValidRole.secretaria,
    ValidRole.tecnico,
    ValidRole.visitor,
  )
  findOne(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.ticketsService.findAuthorizedDetails(id, user);
  }

  @ApiOperation({
    summary: 'Enrutar un ticket',
    description:
      'Asigna o redirige un ticket específico a un área o responsable determinado. Esta operación está restringida a roles con capacidad administrativa de gestión de flujo.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único (UUID) del ticket a ser enrutado.',
    type: 'string',
    format: 'uuid',
  })
  @ApiBody({
    description:
      'Datos necesarios para definir la nueva ruta o destino del ticket.',
  })
  @ApiCreatedResponse({
    description: 'El ticket ha sido enrutado exitosamente.',
  })
  @ApiBadRequestResponse({
    description:
      'El formato del ID es inválido o los datos de enrutamiento no cumplen con el esquema requerido.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticación faltante o expirado.',
  })
  @ApiForbiddenResponse({
    description:
      'El usuario no tiene los privilegios necesarios (SuperAdmin, JefeCC o Coordinador) para realizar esta acción.',
  })
  @ApiNotFoundResponse({
    description: 'No se encontró el ticket con el ID proporcionado.',
  })
  @Post(':id/route')
  @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  routeTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() routeTicketDto: RouteTicketDto,
  ) {
    return this.routeTicketService.routeTicket(id, routeTicketDto);
  }

  @ApiOperation({
    summary: 'Asignar técnicos a un ticket',
    description:
      'Asigna uno o varios técnicos responsables a un ticket específico mediante su identificador único. Reservado para usuarios con roles de supervisión o coordinación.',
  })
  @ApiParam({
    name: 'id',
    description:
      'Identificador único (UUID) del ticket al cual se asignarán los técnicos.',
    type: 'string',
    format: 'uuid',
  })
  @ApiBody({
    description:
      'Listado de identificadores de los técnicos que serán asignados al ticket.',
  })
  @ApiCreatedResponse({
    description: 'Los técnicos han sido asignados exitosamente al ticket.',
  })
  @ApiBadRequestResponse({
    description:
      'El ID proporcionado no es válido o la estructura de la lista de técnicos es incorrecta.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticación faltante o expirado.',
  })
  @ApiForbiddenResponse({
    description:
      'El usuario no cuenta con los permisos necesarios (SuperAdmin, JefeCC o Coordinador) para realizar asignaciones.',
  })
  @ApiNotFoundResponse({
    description: 'No se encontró un ticket con el ID especificado.',
  })
  @Post(':id/assign')
  @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  assignTechnics(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assiTechnicsDto: AssignTechnicsDto,
  ) {
    return this.assignTicketService.assignTechnicians(id, assiTechnicsDto);
  }

  @ApiOperation({
    summary: 'Iniciar atención de un ticket',
    description:
      'Cambia el estado del ticket a iniciado, marcando formalmente el comienzo de la atención técnica. Acción permitida únicamente para administradores o el técnico asignado.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único (UUID) del ticket que se desea iniciar.',
    type: 'string',
    format: 'uuid',
  })
  @ApiCreatedResponse({
    description: 'El ticket ha sido iniciado correctamente.',
  })
  @ApiBadRequestResponse({
    description: 'El formato del ID es inválido.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticación faltante o expirado.',
  })
  @ApiForbiddenResponse({
    description:
      'El usuario no tiene los privilegios de SuperAdmin o Técnico para realizar esta operación.',
  })
  @ApiNotFoundResponse({
    description: 'No se encontró el ticket con el ID proporcionado.',
  })
  @Post(':id/start')
  @Auth(ValidRole.superAdmin, ValidRole.tecnico, ValidRole.coordinador)
  startTicket(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.startTicketService.startTicket(id, user);
  }

  @ApiOperation({
    summary: 'Editar información de un ticket',
    description:
      'Actualiza los campos permitidos de un ticket existente mediante su identificador único. Esta acción está restringida a usuarios con roles administrativos o de planeación.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único (UUID) del ticket a modificar.',
    type: 'string',
    format: 'uuid',
  })
  @ApiBody({
    description: 'Datos del ticket que se desean actualizar.',
  })
  @ApiOkResponse({
    description: 'El ticket ha sido actualizado exitosamente.',
  })
  @ApiBadRequestResponse({
    description:
      'El ID proporcionado es inválido o los datos enviados no cumplen con el esquema de actualización.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticación faltante o expirado.',
  })
  @ApiForbiddenResponse({
    description:
      'El usuario no cuenta con los permisos requeridos (SuperAdmin, Jefe o Planning) para realizar esta edición.',
  })
  @ApiNotFoundResponse({
    description: 'No se encontró un ticket con el ID especificado.',
  })
  @Patch(':id/edit')
  @Auth(ValidRole.superAdmin, ValidRole.jefe, ValidRole.planning)
  editTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTicketDto: UpdateTicketDto,
  ) {
    return this.editTicketService.editTicket(id, updateTicketDto);
  }

  @ApiOperation({
    summary: 'Rechazar un ticket',
    description:
      'Cambia el estado de un ticket a rechazado, requiriendo una justificación detallada de los motivos del rechazo. Operación exclusiva para perfiles con autoridad administrativa.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único (UUID) del ticket a rechazar.',
    type: 'string',
    format: 'uuid',
  })
  @ApiBody({
    description: 'Información y motivos que justifican el rechazo del ticket.',
  })
  @ApiCreatedResponse({
    description: 'El ticket ha sido rechazado correctamente.',
  })
  @ApiBadRequestResponse({
    description:
      'El ID es inválido o los datos de rechazo no cumplen con el formato requerido.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticación faltante o expirado.',
  })
  @ApiForbiddenResponse({
    description:
      'El usuario no posee los permisos (SuperAdmin o JefeCC) para rechazar tickets.',
  })
  @ApiNotFoundResponse({
    description: 'No se encontró un ticket con el ID especificado.',
  })
  @Post(':id/reject')
  @Auth(ValidRole.superAdmin, ValidRole.jefecc)
  rejectTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() rejectTicketDto: RejectTicketDto,
  ) {
    return this.rejectTicketService.rejectTicket(id, rejectTicketDto);
  }

  @ApiOperation({
    summary: 'Registrar intervención técnica',
    description:
      'Permite a los técnicos registrados o administradores añadir una intervención detallada a un ticket específico para documentar acciones realizadas durante la atención.',
  })
  @ApiParam({
    name: 'id',
    description:
      'Identificador único (UUID) del ticket sobre el cual se registrará la intervención.',
    type: 'string',
    format: 'uuid',
  })
  @ApiBody({
    description:
      'Detalles y descripción de la intervención técnica a registrar.',
  })
  @ApiCreatedResponse({
    description:
      'La intervención ha sido registrada exitosamente en el ticket.',
  })
  @ApiBadRequestResponse({
    description: 'Formato de ID inválido o datos de intervención incorrectos.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticación faltante o expirado.',
  })
  @ApiForbiddenResponse({
    description:
      'El usuario no cuenta con los permisos necesarios (SuperAdmin o Técnico) para realizar esta acción.',
  })
  @ApiNotFoundResponse({
    description: 'No se encontró un ticket con el ID proporcionado.',
  })
  @Post(':id/intervene')
  @Auth(ValidRole.superAdmin, ValidRole.tecnico, ValidRole.coordinador)
  registerIntervention(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() interveneTicketDto: InterveneTicketDto,
  ) {
    return this.intervenTicketService.interveneTicket(id, interveneTicketDto);
  }

  // @Post(':id/pause')
  // pauseTicket(
  //   @Param('id', ParseUUIDPipe) id: string,
  //   @Body() pauseTicketDto: PauseTicketDto,
  // ) {
  //   return this.pauseTicketService.pauseTicket(id, pauseTicketDto);
  // }

  @ApiOperation({
    summary: 'Finalizar un ticket',
    description:
      'Marca un ticket como finalizado, concluyendo formalmente el proceso de atención. Requiere información complementaria sobre el cierre del servicio.',
  })
  @ApiParam({
    name: 'id',
    description:
      'Identificador único (UUID) del ticket que se desea finalizar.',
    type: 'string',
    format: 'uuid',
  })
  @ApiBody({
    description:
      'Datos adicionales necesarios para confirmar el cierre exitoso del ticket.',
  })
  @ApiCreatedResponse({
    description: 'El ticket ha sido finalizado correctamente.',
  })
  @ApiBadRequestResponse({
    description:
      'El formato del ID es inválido o los datos de finalización están incompletos.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticación faltante o expirado.',
  })
  @ApiForbiddenResponse({
    description:
      'El usuario no tiene los privilegios necesarios (SuperAdmin, JefeCC, Coordinador o Secretaria) para finalizar este ticket.',
  })
  @ApiNotFoundResponse({
    description: 'No se encontró el ticket con el ID proporcionado.',
  })
  @Post(':id/finish')
  @Auth(
    ValidRole.superAdmin,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.secretaria,
  )
  finishTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() finishTicketDto: FinishTicketDto,
  ) {
    return this.finishTicketService.finishTicket(id, finishTicketDto);
  }

  @ApiOperation({
    summary: 'Cerrar un ticket',
    description:
      'Realiza el cierre administrativo de un ticket, validando que el proceso ha sido completado. Esta acción está reservada para roles de supervisión o planeación.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único (UUID) del ticket a cerrar.',
    type: 'string',
    format: 'uuid',
  })
  @ApiBody({
    description:
      'Datos adicionales requeridos para formalizar el cierre del ticket.',
  })
  @ApiCreatedResponse({
    description: 'El ticket ha sido cerrado exitosamente.',
  })
  @ApiBadRequestResponse({
    description:
      'El formato del ID es inválido o los datos proporcionados para el cierre no son correctos.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticación faltante o expirado.',
  })
  @ApiForbiddenResponse({
    description:
      'El usuario no cuenta con los permisos necesarios (Jefe o Planning) para realizar el cierre.',
  })
  @ApiNotFoundResponse({
    description: 'No se encontró un ticket con el ID especificado.',
  })
  @Post(':id/close')
  @Auth(ValidRole.jefe, ValidRole.planning, ValidRole.superAdmin)
  closeTicket(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
    @Body() closeTicketDto: CloseTicketDto,
  ) {
    return this.closedTicketService.closeTicket(id, user, closeTicketDto);
  }

  @ApiOperation({
    summary: 'Archivar un ticket',
    description:
      'Mueve un ticket a un estado archivado para su almacenamiento a largo plazo o para removerlo de las vistas operativas activas. Acción restringida exclusivamente al rol de Planning.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único (UUID) del ticket a archivar.',
    type: 'string',
    format: 'uuid',
  })
  @ApiCreatedResponse({
    description: 'El ticket ha sido archivado exitosamente.',
  })
  @ApiBadRequestResponse({
    description: 'El formato del ID proporcionado es inválido.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticación faltante o expirado.',
  })
  @ApiForbiddenResponse({
    description:
      'El usuario no cuenta con el rol de Planning necesario para realizar esta acción.',
  })
  @ApiNotFoundResponse({
    description: 'No se encontró un ticket con el ID especificado.',
  })
  @Post(':id/archive')
  @Auth(ValidRole.planning)
  archiveTicket(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.archiveTicketService.archiveTicket(id, user);
  }

  @ApiOperation({
    summary: 'Obtener reporte de rechazo de un ticket',
    description:
      'Recupera el informe detallado generado cuando un ticket ha sido rechazado. Proporciona información sobre los motivos y detalles asociados al rechazo.',
  })
  @ApiParam({
    name: 'id',
    description:
      'Identificador único (UUID) del ticket del cual se desea obtener el reporte de rechazo.',
    type: 'string',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Reporte de rechazo recuperado exitosamente.',
  })
  @ApiBadRequestResponse({
    description: 'El formato del ID proporcionado es inválido.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticación faltante o expirado.',
  })
  @ApiForbiddenResponse({
    description:
      'El usuario no posee los privilegios necesarios para acceder a este reporte.',
  })
  @ApiNotFoundResponse({
    description:
      'No se encontró un reporte de rechazo asociado al ID del ticket especificado.',
  })
  @Get(':id/rejection-report')
  @Auth(
    ValidRole.superAdmin,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.jefe,
    ValidRole.planning,
    ValidRole.secretaria,
  )
  async getRejectionReport(@Param('id', ParseUUIDPipe) ticketId: string) {
    return await this.rejectionReportsService.findOneByTicketIdOrFail(ticketId);
  }

  @ApiOperation({
    summary: 'Obtener reportes técnicos de un ticket',
    description:
      'Recupera un listado con todos los reportes o bitácoras técnicas generadas para un ticket específico. Permite a los usuarios involucrados o de consulta visualizar el historial de intervenciones técnicas.',
  })
  @ApiParam({
    name: 'id',
    description:
      'Identificador único (UUID) del ticket del cual se desean consultar los reportes técnicos.',
    type: 'string',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Listado de reportes técnicos recuperado exitosamente.',
  })
  @ApiBadRequestResponse({
    description: 'El formato del ID proporcionado no es un UUID válido.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticación faltante o expirado.',
  })
  @ApiForbiddenResponse({
    description:
      'El usuario no tiene los permisos necesarios para visualizar los reportes de este ticket.',
  })
  @Get(':id/technical-reports')
  @Auth(
    ValidRole.superAdmin,
    ValidRole.jefecc,
    ValidRole.coordinador,
    ValidRole.secretaria,
    ValidRole.tecnico,
    ValidRole.visitor,
  )
  async getTechnicalReport(@Param('id', ParseUUIDPipe) ticketId: string) {
    return await this.technicalReportsService.findAllByTicketId(ticketId);
  }

  @ApiOperation({
    summary: 'Obtener reportes técnicos de un ticket',
    description:
      'Recupera el listado de todas las intervenciones o reportes técnicos registrados para un ticket específico identificado por su UUID.',
  })
  @ApiParam({
    name: 'id',
    description:
      'Identificador único (UUID) del ticket para consultar sus reportes técnicos asociados.',
    type: 'string',
    format: 'uuid',
  })
  @ApiOkResponse({
    description: 'Listado de reportes técnicos recuperado exitosamente.',
  })
  @ApiBadRequestResponse({
    description: 'El formato del ID proporcionado no es un UUID válido.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticación faltante o expirado.',
  })
  @ApiForbiddenResponse({
    description:
      'El usuario no tiene permisos suficientes para acceder a los reportes técnicos de este ticket.',
  })
  @ApiNotFoundResponse({
    description:
      'No se encontraron reportes técnicos asociados al ticket con el ID especificado.',
  })
  @Get(':id/response')
  @Auth(
    ValidRole.superAdmin,
    ValidRole.jefecc,
    ValidRole.jefe,
    ValidRole.planning,
    ValidRole.coordinador,
    ValidRole.secretaria,
    ValidRole.tecnico,
    ValidRole.visitor,
  )
  async getResponse(@Param('id', ParseUUIDPipe) ticketId: string) {
    return await this.responsesService.findDetailsByTicketIdOrFail(ticketId);
  }

  @ApiOperation({
    summary: 'Actualizar respuesta de un ticket',
    description:
      'Modifica el contenido de la respuesta técnica o administrativa registrada previamente en un ticket. Operación restringida a roles de administración y coordinación.',
  })
  @ApiParam({
    name: 'id',
    description:
      'Identificador único (UUID) del ticket cuya respuesta se desea modificar.',
    type: 'string',
    format: 'uuid',
  })
  @ApiBody({
    description: 'Campos actualizados para el cuerpo de la respuesta.',
  })
  @ApiOkResponse({
    description: 'La respuesta ha sido actualizada exitosamente.',
  })
  @ApiBadRequestResponse({
    description:
      'El ID es inválido o el objeto de actualización no cumple con el esquema requerido.',
  })
  @ApiUnauthorizedResponse({
    description: 'Token de autenticación faltante o expirado.',
  })
  @ApiForbiddenResponse({
    description:
      'El usuario no tiene los permisos (SuperAdmin, JefeCC o Coordinador) para modificar respuestas.',
  })
  @ApiNotFoundResponse({
    description:
      'No se encontró una respuesta asociada al ticket con el ID especificado.',
  })
  @Patch(':id/response')
  @Auth(ValidRole.superAdmin, ValidRole.jefecc, ValidRole.coordinador)
  updateResponse(
    @Param('id', ParseUUIDPipe) ticketId: string,
    @Body() updateResponseDto: UpdateResponseDto,
  ) {
    return this.responsesService.update(ticketId, updateResponseDto);
  }

  @Patch(':id/internal-folio')
  @Auth(ValidRole.superAdmin)
  @ApiOperation({
    summary: 'Actualizar manualmente el folio interno (respuesta) de un ticket',
  })
  @ApiOkResponse({
    description: 'Folio interno actualizado exitosamente.',
  })
  @ApiBadRequestResponse({
    description:
      'El formato del UUID o el cuerpo de la petición son inválidos.',
  })
  @ApiNotFoundResponse({
    description: 'Ticket no encontrado.',
  })
  @ApiConflictResponse({
    description: 'El folio interno especificado ya existe en otro ticket.',
  })
  updateInternalFolio(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTicketInternalFolioDto: UpdateTicketInternalFolioDto,
  ) {
    return this.ticketsService.updateInternalFolio(
      id,
      updateTicketInternalFolioDto,
    );
  }
}
