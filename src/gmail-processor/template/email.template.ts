export const notificationTemplate = (mensaje: string) => {
  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light">
    <meta name="supported-color-schemes" content="light">
  </head>
  <body style="margin:0; padding:0; background-color:#f8fafc; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
    
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc; padding: 40px 20px;">
      <tr>
        <td align="center">
          
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; background-color:#ffffff; border-radius:12px; overflow:hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            
            <tr>
              <td align="center" style="background-color:#1b3d6e; padding: 35px 20px; border-bottom: 4px solid #3b82f6;">
                <h1 style="color:#ffffff; margin:0; font-size:22px; font-weight: 700; letter-spacing: 0.5px;">
                  Centro de Soporte Técnico
                </h1>
                <p style="color:#93c5fd; margin:8px 0 0 0; font-size:14px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase;">
                  Mesa de Ayuda
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding: 40px 35px; color:#334155;">
                
                <h2 style="margin-top:0; margin-bottom: 8px; color:#1e293b; font-size: 20px; font-weight: 600;">Hola 👋</h2>
                <p style="margin-top:0; color:#64748b; font-size:15px; line-height: 1.6;">Este es un mensaje automático de nuestro sistema:</p>

                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 30px 0;">
                  <tr>
                    <td style="padding: 0;">
                      ${mensaje}
                    </td>
                  </tr>
                </table>

                <p style="font-size:13px; color:#94a3b8; margin-top:40px; margin-bottom: 0; padding-top: 20px; border-top: 1px solid #f1f5f9; line-height: 1.5;">
                  Este correo ha sido generado automáticamente. Por favor, no respondas a esta dirección. Si no solicitaste este correo, puedes ignorarlo con seguridad.
                </p>
              </td>
            </tr>

            <tr>
              <td align="center" style="background-color:#f8fafc; padding:25px; font-size:12px; color:#64748b; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; font-weight: 600;">© ${new Date().getFullYear()} Mesa de Ayuda y Soporte Técnico</p>
                <p style="margin: 5px 0 0 0;">Departamento de Tecnologías de la Información</p>
              </td>
            </tr>

          </table>
          
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td height="40">&nbsp;</td></tr>
          </table>

        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
};
