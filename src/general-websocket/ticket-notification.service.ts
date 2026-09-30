import { Injectable, Logger } from '@nestjs/common';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { GmailBotService } from 'src/gmail-bot/gmail-bot.service';
import { TelegramBotService } from 'src/telegram-bot/telegram-bot.service';
import { Ticket } from 'src/tickets/entities/ticket.entity';
import { StaffService } from '../staff/staff.service';

@Injectable()
export class TicketNotificationService {
  private readonly logger = new Logger(TicketNotificationService.name);

  constructor(
    private readonly gmailBotService: GmailBotService,
    private readonly telegramBotService: TelegramBotService,
    private readonly staffService: StaffService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @OnEvent('ticket.created', { async: true })
  async handleTicketCreatedEmails(ticket: Ticket) {
    if (!ticket) return;
    await this.notifyJefeDepto(ticket);
    await this.notifyCentroComputo(ticket);
  }

  @OnEvent('ticket.edited', { async: true })
  async handleTicketEditedEmails(ticket: Ticket) {
    if (!ticket) return;
    if (!ticket) return;

    await this.notifyJefeDeptoOnEdit(ticket);
    await this.notifyCentroComputoOnEdit(ticket);
  }

  @OnEvent('ticket.rejected', { async: true })
  async handleTicketRejectedNotifications(ticket: Ticket) {
    if (!ticket) return;
    if (!ticket) return;

    await this.notifyJefeDeptoOnRejected(ticket);
  }

  @OnEvent('ticket.routed', { async: true })
  async handleTicketRoutedNotifications(ticket: Ticket) {
    if (!ticket) return;
    if (!ticket) return;

    await this.notifyCoordinatorViaTelegram(ticket);
  }

  @OnEvent('ticket.assigned', { async: true })
  async handleTicketAssignedNotifications(ticket: Ticket) {
    if (!ticket || !ticket.attends) return;
    if (!ticket || !ticket.attends) return;

    await this.notifyTechniciansOnAssignment(ticket);
  }

  @OnEvent('ticket.started', { async: true })
  async handleTicketStartedNotifications(ticket: Ticket) {
    if (!ticket) return;
    if (!ticket) return;

    await this.notifyCoordinatorOnStartViaTelegram(ticket);
    await this.notifyJefeDeptoOnStart(ticket);
  }

  @OnEvent('ticket.solved', { async: true })
  async handleTicketSolvedNotifications(ticket: Ticket) {
    if (!ticket) return;
    if (!ticket) return;
    await this.notifyCoordinatorOnSolvedViaTelegram(ticket);
  }

  @OnEvent('ticket.no_solved', { async: true })
  async handleTicketNoSolvedNotifications(ticket: Ticket) {
    if (!ticket) return;
    if (!ticket) return;
    await this.notifyCoordinatorOnNoSolvedViaTelegram(ticket);
  }

  @OnEvent('ticket.finished', { async: true })
  async handleTicketFinishedNotifications(ticket: Ticket) {
    if (!ticket) return;
    if (!ticket) return;
    await this.notifyJefeDeptoOnFinished(ticket);
  }

  @OnEvent('ticket.closed', { async: true })
  async handleTicketClosedNotifications(ticket: Ticket) {
    if (!ticket) return;
    if (!ticket) return;
    await this.notifyCoordinatorOnClosedViaTelegram(ticket);
    await this.notifyPlanningBossesOnClosed(ticket);
  }

  @OnEvent('ticket.archived', { async: true })
  async handleTicketArchivedNotifications(ticket: Ticket) {
    if (!ticket) return;
    if (!ticket) return;
    await this.notifyCoordinatorOnArchivedViaTelegram(ticket);
  }

  private async notifyPlanningBossesOnClosed(ticket: Ticket) {
    const planningBosses = await this.staffService.findAllPlaningBossContact();

    if (!planningBosses || planningBosses.length === 0) {
      this.logger.warn(
        'No se encontraron Jefes de Planeación para notificar el cierre del ticket.',
      );
      return;
    }

    const asunto = `Solicitud Cerrada - Requiere Confirmación (Folio: ${ticket.folio})`;
    const urlBase = process.env.FRONTEND_URL || 'http://localhost:5173/';
    const linkTicket = `${urlBase}/tickets/${ticket.id}`;

    for (const boss of planningBosses) {
      const bossEmail = boss.user?.email;

      if (!bossEmail) continue;

      const nombreBoss = boss.name || 'Jefe de Planeación';

      const mensajeHTML = `
        <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
          <p>Hola <strong>${nombreBoss}</strong>,</p>
          <p>Se ha registrado una solicitud de soporte como <strong style="color: #6c757d;">CERRADA</strong> en el sistema.</p>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-left: 4px solid #6c757d; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #6c757d;">Detalles del Reporte</h3>
            <ul style="list-style-type: none; padding-left: 0;">
              <li style="margin-bottom: 8px;"><strong>Folio:</strong> ${ticket.folio}</li>
              <li style="margin-bottom: 8px;"><strong>Departamento solicitante:</strong> ${ticket.jefe_depto?.department?.name || 'No especificado'}</li>
              <li style="margin-bottom: 8px;"><strong>Falla reportada:</strong> ${ticket.description}</li>
            </ul>
          </div>
          
          <p>Por favor, ingresa al sistema para <strong>confirmar su recepción y archivarla</strong> adecuadamente.</p>
          
          <div style="margin-top: 25px;">
            <a href="${linkTicket}" style="display: inline-block; padding: 12px 24px; background-color: #6c757d; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; text-align: center;">
              Ir a la Solicitud
            </a>
          </div>
        </div>
      `;

      try {
        await this.gmailBotService.sendEmail(bossEmail, asunto, mensajeHTML);
      } catch (error) {
        this.logger.error(
          `Error al enviar correo de ticket cerrado al Jefe de Planeación ${boss.id}:`,
          error,
        );
      }
    }
  }

  private async notifyCoordinatorOnArchivedViaTelegram(ticket: Ticket) {
    const telegramId = ticket.coordinator?.idTelegram;

    if (!telegramId) return;

    const mensaje = `
🗃️ <b>Ticket Archivado</b>

<b>Folio:</b> ${ticket.folio}
<b>Departamento:</b> ${ticket.jefe_depto?.department?.name || 'No especificado'}

Este ticket ha sido archivado por el Departamento de Planeación Programación y Presupuestación.
    `.trim();

    try {
      await this.telegramBotService.sendNotification(telegramId, mensaje);
    } catch (error) {
      this.logger.error(
        'Error al enviar notificación de Telegram de archivado para el coordinador:',
        error,
      );
    }
  }

  private async notifyCoordinatorOnClosedViaTelegram(ticket: Ticket) {
    const telegramId = ticket.coordinator?.idTelegram;

    if (!telegramId) return;

    const mensaje = `
🔒 <b>Ticket Cerrado</b>

<b>Folio:</b> ${ticket.folio}
<b>Departamento:</b> ${ticket.jefe_depto?.department?.name || 'No especificado'}

Este ticket ha sido cerrado formalmente en el sistema por el solicitante.
    `.trim();

    try {
      await this.telegramBotService.sendNotification(telegramId, mensaje);
    } catch (error) {
      this.logger.error(
        'Error al enviar notificación de Telegram de cierre para el coordinador:',
        error,
      );
    }
  }

  private async notifyJefeDeptoOnFinished(ticket: Ticket) {
    const jefeEmail = ticket.jefe_depto?.user?.email;

    if (!jefeEmail) {
      this.logger.warn(
        `No se encontró un correo asociado al jefe de depto para el ticket finalizado ${ticket.id}`,
      );
      return;
    }

    const asuntoDepto = `Ticket Finalizado - Folio: ${ticket.folio}`;
    const nombreJefe = ticket.jefe_depto?.name || 'Usuario';
    const urlBase = process.env.FRONTEND_URL || 'http://localhost:5173/';
    // Asegúrate de que esta URL lleve al jefe a la vista donde pueda ver el reporte y llenar la encuesta
    const linkTicket = `${urlBase}/tickets/${ticket.id}`;

    const mensajeHTML = `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <p>Hola <strong>${nombreJefe}</strong>,</p>
        <p>Te informamos que tu solicitud de soporte ha sido marcada como <strong style="color: #198754;">FINALIZADA</strong>.</p>
        
        <div style="background-color: #f8fdfa; padding: 15px; border-left: 4px solid #198754; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #198754;">Detalles del Ticket</h3>
          <ul style="list-style-type: none; padding-left: 0;">
            <li style="margin-bottom: 8px;"><strong>Folio:</strong> ${ticket.folio}</li>
            <li style="margin-bottom: 8px;"><strong>Falla reportada:</strong> ${ticket.description}</li>
          </ul>
        </div>
        
        <p>Agradecemos tu paciencia durante el proceso. Por favor, ingresa al sistema para consultar la orden de trabajo y <strong>completar la encuesta de satisfacción</strong>.</p>

        <div style="margin-top: 25px;">
          <a href="${linkTicket}" style="display: inline-block; padding: 12px 24px; background-color: #198754; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; text-align: center;">
            Ir al Sistema
          </a>
        </div>
      </div>
    `;

    try {
      await this.gmailBotService.sendEmail(jefeEmail, asuntoDepto, mensajeHTML);
    } catch (error) {
      this.logger.error(
        'Error al enviar correo de ticket finalizado al Jefe de Depto:',
        error,
      );
    }
  }

  private async notifyCoordinatorOnSolvedViaTelegram(ticket: Ticket) {
    const telegramId = ticket.coordinator?.idTelegram;

    if (!telegramId) return;

    const urlBase = !process.env.DB_SYNCHRONIZE
      ? process.env.FRONTEND_URL || 'http://soportetecnicoito.com'
      : 'soportetecnicoito.com';

    const linkTicket = `${urlBase}/tickets/${ticket.id}`;

    const mensaje = `
✅ <b>Ticket Resuelto</b>

<b>Folio:</b> ${ticket.folio}
<b>Departamento:</b> ${ticket.jefe_depto?.department?.name || 'No especificado'}

La solicitud fue resuelta. Por favor, revisa las bitácoras técnicas para elaborar la respuesta y orden de trabajo.
    `.trim();

    const opcionesTelegram = {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🎫 Ver Ticket en el Sistema',
              url: linkTicket,
            },
          ],
        ],
      },
    };

    try {
      await this.telegramBotService.sendNotification(
        telegramId,
        mensaje,
        opcionesTelegram,
      );
    } catch (error) {
      this.logger.error(
        'Error al enviar Telegram (Resuelto) al coordinador:',
        error,
      );
    }
  }

  private async notifyCoordinatorOnNoSolvedViaTelegram(ticket: Ticket) {
    const telegramId = ticket.coordinator?.idTelegram;

    if (!telegramId) return;

    const urlBase = !process.env.DB_SYNCHRONIZE
      ? process.env.FRONTEND_URL || 'http://soportetecnicoito.com'
      : 'soportetecnicoito.com';

    const linkTicket = `${urlBase}/tickets/${ticket.id}`;

    const mensaje = `
⚠️ <b>Ticket No Resuelto</b>

<b>Folio:</b> ${ticket.folio}
<b>Departamento:</b> ${ticket.jefe_depto?.department?.name || 'No especificado'}

La solicitud NO fue resuelta. Por favor, revisa la bitácora de trabajo y analiza si se requiere una reasignación o finalizar el ticket.
    `.trim();

    const opcionesTelegram = {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🎫 Ver Ticket en el Sistema',
              url: linkTicket,
            },
          ],
        ],
      },
    };

    try {
      await this.telegramBotService.sendNotification(
        telegramId,
        mensaje,
        opcionesTelegram,
      );
    } catch (error) {
      this.logger.error(
        'Error al enviar Telegram (No Resuelto) al coordinador:',
        error,
      );
    }
  }

  private async notifyCoordinatorOnStartViaTelegram(ticket: Ticket) {
    const telegramId = ticket.coordinator?.idTelegram;

    if (!telegramId) return;

    const mensaje = `
<b>Se ha iniciado la atención del ticket</b>

<b>Folio:</b> ${ticket.folio}
<b>Departamento:</b> ${ticket.jefe_depto?.department?.name || 'No especificado'}

El técnico asignado ya está trabajando en esta solicitud.
    `.trim();

    try {
      await this.telegramBotService.sendNotification(telegramId, mensaje);
    } catch (error) {
      this.logger.error(
        'Error al enviar notificación de Telegram para el coordinador al iniciar el ticket:',
        error,
      );
    }
  }

  private async notifyJefeDeptoOnStart(ticket: Ticket) {
    const jefeEmail = ticket.jefe_depto?.user?.email;

    if (!jefeEmail) {
      this.logger.warn(
        `No se encontró un correo asociado al jefe de depto para el inicio del ticket ${ticket.id}`,
      );
      return;
    }

    const asuntoDepto = `Atención Iniciada - Folio: ${ticket.folio}`;
    const nombreJefe = ticket.jefe_depto?.name || 'Usuario';
    const urlBase = process.env.FRONTEND_URL || 'http://localhost:5173';
    const linkTicket = `${urlBase}/tickets/${ticket.id}`;

    const mensajeHTML = `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <p>Hola <strong>${nombreJefe}</strong>,</p>
        <p>Te informamos que el personal técnico <strong>HA INICIADO</strong> a trabajar en tu solicitud de soporte.</p>
        
        <div style="background-color: #e6f2ff; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #007bff;">Detalles del Ticket en Proceso</h3>
          <ul style="list-style-type: none; padding-left: 0;">
            <li style="margin-bottom: 8px;"><strong>Folio:</strong> ${ticket.folio}</li>
            <li style="margin-bottom: 8px;"><strong>Falla reportada:</strong> ${ticket.description}</li>
          </ul>
        </div>
        
        <p>Te notificaremos nuevamente cuando el servicio haya concluido y se genere tu reporte técnico.</p>

        <div style="margin-top: 25px;">
          <a href="${linkTicket}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; text-align: center;">
            Ver Estado del Ticket
          </a>
        </div>
      </div>
    `;

    try {
      await this.gmailBotService.sendEmail(jefeEmail, asuntoDepto, mensajeHTML);
    } catch (error) {
      this.logger.error(
        'Error al enviar correo de inicio de atención al Jefe de Depto:',
        error,
      );
    }
  }

  private async notifyTechniciansOnAssignment(ticket: Ticket) {
    const urlBase = process.env.FRONTEND_URL || 'http://localhost:5173/';
    const linkTicket = `${urlBase}/tickets/${ticket.id}`;

    for (const attend of ticket.attends) {
      const technician = attend.technician;
      const techEmail = technician?.user?.email;

      if (techEmail) {
        const asuntoTech = `Nueva Asignación de Ticket - Folio: ${ticket.folio}`;
        const nombreTech = technician?.name || 'Técnico';
        const departamento =
          ticket.jefe_depto?.department?.name || 'No especificado';

        const mensajeHTML = `
          <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
            <p>Hola <strong>${nombreTech}</strong>,</p>
            <p>Se te ha asignado un nuevo ticket de soporte técnico.</p>
            
            <div style="background-color: #f4fdf8; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #28a745;">Detalles de la Asignación</h3>
              <ul style="list-style-type: none; padding-left: 0;">
                <li style="margin-bottom: 8px;"><strong>Folio:</strong> ${ticket.folio}</li>
                <li style="margin-bottom: 8px;"><strong>Departamento:</strong> ${departamento}</li>
                <li style="margin-bottom: 8px;"><strong>Falla reportada:</strong> ${ticket.description}</li>
              </ul>
            </div>
            
            <p>Por favor, ingresa al sistema para iniciar la atención cuando estés disponible.</p>

            <div style="margin-top: 25px;">
              <a href="${linkTicket}" style="display: inline-block; padding: 12px 24px; background-color: #28a745; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; text-align: center;">
                Ver Ticket
              </a>
            </div>
          </div>
        `;

        try {
          await this.gmailBotService.sendEmail(
            techEmail,
            asuntoTech,
            mensajeHTML,
          );
        } catch (error) {
          this.logger.error(
            `Error al enviar correo de asignación para el técnico ${technician.id}`,
            error,
          );
        }
      }
    }
  }

  private async notifyCoordinatorViaTelegram(ticket: Ticket) {
    const telegramId = ticket.coordinator?.idTelegram;

    if (!telegramId) {
      this.logger.log(
        `El coordinador asignado al ticket ${ticket.folio} no tiene ID de Telegram configurado.`,
      );
      return;
    }

    const urlBase = !process.env.DB_SYNCHRONIZE
      ? process.env.FRONTEND_URL || 'soportetecnicoito.com'
      : 'soportetecnicoito.com';

    const linkTicket = `${urlBase}/tickets/${ticket.id}`;

    const mensaje = `
<b>Se te ha canalizado un nuevo ticket</b>

<b>Folio:</b> ${ticket.folio}
<b>Departamento:</b> ${ticket.jefe_depto?.department?.name || 'No especificado'}

Por favor, ingresa al sistema para asignarlo a un técnico.
    `.trim();

    const opcionesTelegram = {
      parse_mode: 'HTML',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🎫 Ver Ticket en el Sistema',
              url: linkTicket,
            },
          ],
        ],
      },
    };

    try {
      await this.telegramBotService.sendNotification(
        telegramId,
        mensaje,
        opcionesTelegram,
      );
    } catch (error) {
      this.logger.error(
        'Error al enviar notificación de Telegram al coordinador:',
        error,
      );
    }
  }

  private async notifyCentroComputo(ticket: Ticket) {
    const bossesCC = await this.staffService.findAllBossCCContact();

    if (!bossesCC || bossesCC.length === 0) {
      this.logger.warn(
        'No se encontraron Jefes de CC para notificar la creación del ticket.',
      );
      return;
    }

    const deptoAcr = ticket.jefe_depto?.department?.acronym || 'Desconocido';
    const asunto = `[NUEVO TICKET] Requiere Asignación - Folio: ${ticket.folio} (${deptoAcr})`;

    const nombreSolicitante =
      `${ticket.jefe_depto?.name || ''} ${ticket.jefe_depto?.paternalSurname || ''} ${ticket.jefe_depto?.maternalSurname || ''}`.trim();
    const nombreDepartamento =
      ticket.jefe_depto?.department?.name || 'No especificado';

    const urlBase = process.env.FRONTEND_URL || 'http://localhost:5173';
    const linkTicket = `${urlBase}/tickets/${ticket.id}`;

    const mensajeHTML = `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <p>Se ha registrado un nuevo ticket en el sistema que requiere canalización.</p>
        
        <div style="background-color: #fdf2ce; padding: 15px; border-left: 4px solid #f0ad4e; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #d58512;">Información de la Solicitud</h3>
          <ul style="list-style-type: none; padding-left: 0;">
            <li style="margin-bottom: 8px;"><strong>Folio:</strong> ${ticket.folio}</li>
            <li style="margin-bottom: 8px;"><strong>Departamento:</strong> ${nombreDepartamento}</li>
            <li style="margin-bottom: 8px;"><strong>Solicitante:</strong> ${nombreSolicitante}</li>
            <li style="margin-bottom: 8px;"><strong>Falla reportada:</strong> ${ticket.description}</li>
          </ul>
        </div>
        
        <p>Por favor, ingresa al sistema para asignar un coordinador a este folio.</p>

        <div style="margin-top: 25px;">
          <a href="${linkTicket}" style="display: inline-block; padding: 12px 24px; background-color: #f0ad4e; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; text-align: center;">
            Ir al Sistema de Tickets
          </a>
        </div>
      </div>
    `;

    for (const boss of bossesCC) {
      const correoJefeCC = boss.user?.email;

      if (correoJefeCC) {
        try {
          await this.gmailBotService.sendEmail(
            correoJefeCC,
            asunto,
            mensajeHTML,
          );
        } catch (error) {
          this.logger.error(
            `Error al enviar correo al Jefe del CC (${correoJefeCC}):`,
            error,
          );
        }
      }
    }
  }

  private async notifyJefeDepto(ticket: Ticket) {
    const jefeEmail = ticket.jefe_depto?.user?.email;

    if (!jefeEmail) {
      this.logger.warn(
        `No se encontró un correo asociado al jefe de depto para el ticket ${ticket.id}`,
      );
      return;
    }

    const asunto = `Confirmación de Ticket Creado - Folio: ${ticket.folio}`;
    const nombreJefe = ticket.jefe_depto?.name || 'Usuario';

    const mensajeHTML = `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <p>Hola <strong>${nombreJefe}</strong>,</p>
        <p>Tu solicitud de soporte técnico ha sido registrada correctamente en el sistema.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #0056b3; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #0056b3;">Detalles del Ticket</h3>
          <ul style="list-style-type: none; padding-left: 0;">
            <li style="margin-bottom: 8px;"><strong>Folio:</strong> ${ticket.folio}</li>
            <li style="margin-bottom: 8px;"><strong>Falla reportada:</strong> ${ticket.description}</li>
          </ul>
        </div>
        
        <p>Pronto será revisada para su atención.</p>
      </div>
    `;

    try {
      await this.gmailBotService.sendEmail(jefeEmail, asunto, mensajeHTML);
    } catch (error) {
      this.logger.error('Error al enviar correo al Jefe de Depto:', error);
    }
  }

  private async notifyJefeDeptoOnEdit(ticket: Ticket) {
    const jefeEmail = ticket.jefe_depto?.user?.email;

    if (!jefeEmail) {
      this.logger.warn(
        `No se encontró un correo asociado al jefe de depto para la edición del ticket ${ticket.id}`,
      );
      return;
    }

    const asunto = `Confirmación de Modificación - Folio: ${ticket.folio}`;
    const nombreJefe = ticket.jefe_depto?.name || 'Usuario';
    const urlBase = process.env.FRONTEND_URL || 'http://localhost:5173/';
    const linkTicket = `${urlBase}/tickets/${ticket.id}`;

    const mensajeHTML = `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <p>Hola <strong>${nombreJefe}</strong>,</p>
        <p>Los datos de tu solicitud de soporte han sido <strong>ACTUALIZADOS</strong> correctamente en el sistema.</p>
        
        <div style="background-color: #f0f8ff; padding: 15px; border-left: 4px solid #0056b3; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #0056b3;">Información Actual del Ticket</h3>
          <ul style="list-style-type: none; padding-left: 0;">
            <li style="margin-bottom: 8px;"><strong>Folio:</strong> ${ticket.folio}</li>
            <li style="margin-bottom: 8px;"><strong>Falla reportada:</strong> ${ticket.description}</li>
          </ul>
        </div>
        
        <p>Puedes revisar los detalles actualizados ingresando al sistema.</p>

        <div style="margin-top: 25px;">
          <a href="${linkTicket}" style="display: inline-block; padding: 12px 24px; background-color: #0056b3; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; text-align: center;">
            Ver Mi Ticket
          </a>
        </div>
      </div>
    `;

    try {
      await this.gmailBotService.sendEmail(jefeEmail, asunto, mensajeHTML);
    } catch (error) {
      this.logger.error(
        'Error al enviar correo de edición al Jefe de Depto:',
        error,
      );
    }
  }

  private async notifyCentroComputoOnEdit(ticket: Ticket) {
    const bossesCC = await this.staffService.findAllBossCCContact();

    if (!bossesCC || bossesCC.length === 0) {
      this.logger.warn(
        'No se encontraron Jefes de CC para notificar la actualización del ticket.',
      );
      return;
    }

    const deptoAcr = ticket.jefe_depto?.department?.acronym || 'Desconocido';
    const asunto = `[TICKET ACTUALIZADO] Revisión requerida - Folio: ${ticket.folio} (${deptoAcr})`;

    const nombreSolicitante =
      `${ticket.jefe_depto?.name || ''} ${ticket.jefe_depto?.paternalSurname || ''} ${ticket.jefe_depto?.maternalSurname || ''}`.trim();
    const nombreDepartamento =
      ticket.jefe_depto?.department?.name || 'No especificado';

    const urlBase = process.env.FRONTEND_URL || 'http://localhost:5173/';
    const linkTicket = `${urlBase}/tickets/${ticket.id}`;

    const mensajeHTML = `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <p>El siguiente ticket ha sido <strong>MODIFICADO</strong> y requiere una revisión para su seguimiento.</p>
        
        <div style="background-color: #e0f7fa; padding: 15px; border-left: 4px solid #17a2b8; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #008b8b;">Datos Actualizados del Ticket</h3>
          <ul style="list-style-type: none; padding-left: 0;">
            <li style="margin-bottom: 8px;"><strong>Folio:</strong> ${ticket.folio}</li>
            <li style="margin-bottom: 8px;"><strong>Departamento:</strong> ${nombreDepartamento}</li>
            <li style="margin-bottom: 8px;"><strong>Solicitante:</strong> ${nombreSolicitante}</li>
            <li style="margin-bottom: 8px;"><strong>Falla actual:</strong> ${ticket.description}</li>
          </ul>
        </div>
        
        <p>Por favor, ingresa al sistema para verificar los cambios y proceder con la atención del reporte.</p>

        <div style="margin-top: 25px;">
          <a href="${linkTicket}" style="display: inline-block; padding: 12px 24px; background-color: #17a2b8; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; text-align: center;">
            Ver Ticket Actualizado
          </a>
        </div>
      </div>
    `;

    for (const boss of bossesCC) {
      const correoJefeCC = boss.user?.email;

      if (correoJefeCC) {
        try {
          await this.gmailBotService.sendEmail(
            correoJefeCC,
            asunto,
            mensajeHTML,
          );
        } catch (error) {
          this.logger.error(
            `Error al enviar correo de actualización al Jefe del CC (${correoJefeCC}):`,
            error,
          );
        }
      }
    }
  }

  private async notifyJefeDeptoOnRejected(ticket: Ticket) {
    const jefeEmail = ticket.jefe_depto?.user?.email;

    if (!jefeEmail) {
      this.logger.warn(
        `No se encontró un correo asociado al jefe de depto del ticket ${ticket.id}`,
      );
      return;
    }

    const asuntoDepto = `Solicitud Rechazada - Folio: ${ticket.folio}`;
    const nombreJefe = ticket.jefe_depto?.name || 'Usuario';

    const urlBase = process.env.FRONTEND_URL || 'http://localhost:5173/';
    const linkTicket = `${urlBase}/tickets/${ticket.id}/edit`;

    const mensajeHTML = `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
        <p>Hola <strong>${nombreJefe}</strong>,</p>
        <p>Te informamos que tu solicitud de soporte ha sido <strong style="color: #d9534f;">RECHAZADA</strong> por el Centro de Cómputo.</p>
        
        <div style="background-color: #fdf2f2; padding: 15px; border-left: 4px solid #d9534f; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #d9534f;">Detalles del Ticket</h3>
          <ul style="list-style-type: none; padding-left: 0;">
            <li style="margin-bottom: 8px;"><strong>Folio:</strong> ${ticket.folio}</li>
            <li style="margin-bottom: 8px;"><strong>Falla reportada:</strong> ${ticket.description}</li>
          </ul>
        </div>
        
        <p>Por favor, ingresa al sistema para consultar el reporte técnico de rechazo donde se explican los motivos y realiza las modificaciones necesarias.</p>
        
        <div style="margin-top: 25px;">
          <a href="${linkTicket}" style="display: inline-block; padding: 12px 24px; background-color: #d9534f; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; text-align: center;">
            Ver Detalles del Rechazo
          </a>
        </div>
      </div>
    `;

    try {
      await this.gmailBotService.sendEmail(jefeEmail, asuntoDepto, mensajeHTML);
    } catch (error) {
      this.logger.error(
        'Error al enviar correo de rechazo al Jefe de Depto',
        error,
      );
    }
  }
}
