export const notificationChangedPasswordContent = (
  nombre: string,
  apellidoP: string,
  apellidoM: string,
) => {
  const nombreCompleto = `${nombre} ${apellidoP} ${apellidoM}`;

  return `
    <p style="margin-top:0; color:#1e293b; font-size:16px; line-height:1.6;">
      Estimado/a <strong>${nombreCompleto}</strong>:
    </p>
    
    <p style="color:#475569; font-size:15px; line-height:1.6; margin-bottom:20px;">
      El área de Soporte Técnico ha detectado un <strong>cambio reciente en su contraseña</strong> de acceso a su cuenta institucional.
    </p>

    <p style="color:#475569; font-size:15px; line-height:1.6; margin-bottom:30px;">
      Si usted realizó esta modificación de forma intencional, no es necesario realizar ninguna acción adicional y puede omitir este mensaje de forma segura.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fff1f2; border-left:4px solid #e11d48; border-radius:0 6px 6px 0;">
      <tr>
        <td style="padding: 18px 20px; font-size:13.5px; line-height:1.6; color:#9f1239;">
          <strong style="font-size: 14.5px;">⚠️ ¿No reconoce esta actividad?</strong><br>
          En caso de que usted no haya solicitado ni realizado este cambio, le recomendamos <strong>reportarlo de inmediato</strong> al área de Soporte Técnico para proteger la integridad y seguridad de su cuenta.
        </td>
      </tr>
    </table>
  `;
};
