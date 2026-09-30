export const notificationRecuperatePasswordTemplate = (
  nombre: string,
  apellidoP: string,
  apellidoM: string,
  tempPassword: string,
) => {
  const nombreCompleto = `${nombre} ${apellidoP} ${apellidoM}`;

  return `
    <h2 style="margin-top:0; color:#1b3d6e; font-size: 20px;">Estimado/a ${nombreCompleto},</h2>
    <p>En atención a su solicitud de recuperación de contraseña, se ha generado una <strong> nueva contraseña</strong> para su cuenta :</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:30px 0;">
      <tr>
        <td align="center" style="background-color:#f4f6f9; padding:30px; border: 2px dashed #cbd5e1; border-radius:8px;">
          <span style="display:block; font-size:11px; color:#64748b; margin-bottom:10px; text-transform:uppercase; font-weight:bold; letter-spacing:1px;">
            Nueva Contraseña
          </span>
          <span style="font-family: 'Courier New', Courier, monospace; font-size:32px; font-weight:bold; color:#1b3d6e; letter-spacing:4px;">
            ${tempPassword}
          </span>
        </td>
      </tr>
    </table>

    <p>Por motivos de seguridad, le solicitamos iniciar sesión a la brevedad y <strong>cambiar esta contraseña inmediatamente</strong>.</p>

    <div style="margin-top:35px; padding:15px; background-color:#fff1f2; border-left:4px solid #e11d48;">
       <p style="margin:0; font-size:12px; color:#9f1239;">
        <strong>Aviso:</strong> Si no solicitó este cambio, contacte al área de Soporte Técnico.
      </p>
    </div>
  `;
};
