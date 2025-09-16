const generateOTPEmail = (otp: string, name: string) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <title>Email Verification</title>
    </head>
    <body style="font-family: Arial, sans-serif; background-color: #f6f9fc; margin: 0; padding: 0;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 30px 20px;">
            <table role="presentation" style="max-width: 600px; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <tr>
                <td style="background: #4f46e5; padding: 20px; text-align: center; color: white; font-size: 22px; font-weight: bold;">
                  🚚 CheckMate Driver Verification
                </td>
              </tr>
              <tr>
                <td style="padding: 30px; color: #333; font-size: 16px; line-height: 1.6;">
                  <p>Hi <strong>${name}</strong>,</p>
                  <p>Welcome to <strong>Danyel Gamez</strong>! To complete your driver registration, please use the verification code below:</p>
                  <p style="text-align: center; margin: 30px 0;">
                    <span style="display: inline-block; background: #4f46e5; color: #fff; padding: 12px 24px; font-size: 24px; font-weight: bold; letter-spacing: 4px; border-radius: 6px;">
                      ${otp}
                    </span>
                  </p>
                  <p>This code will expire in <strong>10 minutes</strong>. If you didn’t request this, you can ignore this email.</p>
                  <p>Thanks,<br/>The CheckMate Team</p>
                </td>
              </tr>
              <tr>
                <td style="background: #f1f1f1; text-align: center; padding: 15px; font-size: 12px; color: #777;">
                  © ${new Date().getFullYear()} CheckMate. All rights reserved.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
};
export default generateOTPEmail;
