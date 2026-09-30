import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { SurveyService } from './survey.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { ValidRole } from 'src/auth/interfaces/valid-roles';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { FilterQuestionsDto } from './dto/filter-questions.dto';
import { SurveyQuestion } from './entities/survey-question.entity';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Controller('survey')
export class SurveyController {
  constructor(private readonly surveyService: SurveyService) {}

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener los detalles de una pregunta específica',
    description:
      'Devuelve toda la información de una pregunta en base a su identificador único UUID v4.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único de la pregunta (formato UUID v4)',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    description: 'Detalles de la pregunta obtenidos exitosamente.',
    type: SurveyQuestion,
  })
  @ApiBadRequestResponse({
    description:
      'El formato del ID proporcionado no corresponde a un UUID válido.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autenticado. Token JWT faltante, expirado o inválido.',
  })
  @ApiForbiddenResponse({
    description: 'No autorizado. Se requieren permisos de superAdmin.',
  })
  @ApiNotFoundResponse({
    description: 'No se encontró ninguna pregunta con el ID especificado.',
  })
  @Get('questions/:id')
  @Auth(ValidRole.superAdmin)
  async findOneQuestion(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SurveyQuestion> {
    return await this.surveyService.findOneOrFail(id);
  }

  @Post('questions')
  @Auth(ValidRole.superAdmin)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una nueva pregunta' })
  @ApiOkResponse({
    description: 'La pregunta ha sido creada exitosamente.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autenticado (Token faltante o inválido).',
  })
  @ApiForbiddenResponse({
    description: 'No autorizado. Se requiere rol de superAdmin.',
  })
  async createQuestion(@Body() createQuestionDto: CreateQuestionDto) {
    return await this.surveyService.createQuestion(
      createQuestionDto.questionText,
      createQuestionDto.type,
    );
  }

  @ApiOperation({ summary: 'Obtener preguntas activas' })
  @ApiOkResponse({
    description: 'Lista de preguntas activas vigentes para el formulario.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autenticado (Token faltante o inválido).',
  })
  @ApiForbiddenResponse({
    description: 'No autorizado. Se requiere rol de jefe de departamento.',
  })
  @Get('questions')
  @Auth(ValidRole.jefe, ValidRole.planning, ValidRole.superAdmin)
  async getActiveQuestions() {
    return await this.surveyService.getActiveQuestions();
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener el listado paginado de todas las preguntas del sistema',
    description:
      'Permite consultar todas las preguntas (activas e inactivas) con soporte para paginación, búsqueda por texto y filtrado por estado de activación.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autenticado (Token faltante o inválido).',
  })
  @ApiForbiddenResponse({
    description: 'No autorizado. Se requiere rol de superAdmin.',
  })
  @ApiOkResponse({
    description: 'Lista paginada de preguntas obtenida exitosamente.',
  })
  @Get('admin/questions')
  @Auth(ValidRole.superAdmin)
  async findAllQuestions(@Query() filterDto: FilterQuestionsDto) {
    return await this.surveyService.findAllQuestions(filterDto);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Activar una pregunta',
    description:
      'Cambia el estado de una pregunta a activa (isActive = true), permitiendo que aparezca en las nuevas encuestas de satisfacción generadas.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único de la pregunta (formato UUID v4)',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    description: 'La pregunta ha sido activada exitosamente.',
    type: SurveyQuestion,
  })
  @ApiBadRequestResponse({
    description:
      'El formato del ID proporcionado no corresponde a un UUID válido.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autenticado. Token JWT faltante, expirado o inválido.',
  })
  @ApiForbiddenResponse({
    description:
      'No autorizado. Se requieren permisos de superAdmin para realizar esta acción.',
  })
  @ApiNotFoundResponse({
    description:
      'No se encontró ninguna pregunta con el ID especificado en la base de datos.',
  })
  @Patch('questions/:id/activate')
  @HttpCode(HttpStatus.OK)
  @Auth(ValidRole.superAdmin)
  async activateQuestion(@Param('id', ParseUUIDPipe) id: string) {
    return await this.surveyService.activate(id);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Desactivar una pregunta',
    description:
      'Cambia el estado de una pregunta a inactiva (isActive = false). Ocultará la pregunta en futuras encuestas sin alterar el historial de tickets pasados.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único de la pregunta (formato UUID v4)',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    description: 'La pregunta ha sido desactivada exitosamente.',
    type: SurveyQuestion,
  })
  @ApiBadRequestResponse({
    description:
      'El formato del ID proporcionado no corresponde a un UUID válido.',
  })
  @ApiUnauthorizedResponse({
    description: 'No autenticado. Token JWT faltante, expirado o inválido.',
  })
  @ApiForbiddenResponse({
    description:
      'No autorizado. Se requieren permisos de superAdmin para realizar esta acción.',
  })
  @ApiNotFoundResponse({
    description:
      'No se encontró ninguna pregunta con el ID especificado en la base de datos.',
  })
  @Patch('questions/:id/deactivate')
  @HttpCode(HttpStatus.OK)
  @Auth(ValidRole.superAdmin)
  async deactivateQuestion(@Param('id', ParseUUIDPipe) id: string) {
    return await this.surveyService.deactivate(id);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Editar una pregunta existente',
    description:
      'Permite modificar el texto, el tipo de respuesta o el estado de una pregunta. No afecta las respuestas históricas ya capturadas en los tickets.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único de la pregunta (UUID v4)',
    type: String,
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    description: 'La pregunta se actualizó con éxito.',
    type: SurveyQuestion,
  })
  @ApiUnauthorizedResponse({
    description: 'No autenticado. Token JWT faltante, expirado o inválido.',
  })
  @ApiForbiddenResponse({
    description:
      'No autorizado. Se requieren permisos de superAdmin para realizar esta acción.',
  })
  @ApiNotFoundResponse({ description: 'Pregunta no encontrada.' })
  @ApiBadRequestResponse({
    description: 'Datos de entrada inválidos o formato de UUID incorrecto.',
  })
  @Patch('questions/:id')
  @HttpCode(HttpStatus.OK)
  @Auth(ValidRole.superAdmin)
  async updateQuestion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateQuestionDto,
  ): Promise<SurveyQuestion> {
    return await this.surveyService.updateQuestion(id, updateDto);
  }
}
