const nodemailer = require("nodemailer");

/**
 * Create a reusable Nodemailer transporter
 * Uses Gmail service with app-specific credentials
 */
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    family: 4, // Force IPv4 to prevent ENETUNREACH on cloud hosts
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: true,
    },
});

/**
 * Build a modern, SaaS-styled HTML email template (Linear / Supabase / Vercel aesthetic)
 * @param {string} otp - The 6-digit OTP code
 * @param {string} purpose - "verify" | "reset"
 * @returns {string} HTML email markup string
 */
const buildOtpTemplate = (otp, purpose = "verify") => {
    const isReset = purpose === "reset";

    const heading = isReset
        ? "Reset your password"
        : "Confirm your email address";

    const subtext = isReset
        ? "Please enter this 6-digit code to reset your password and access your workspace."
        : "Please enter this 6-digit code to complete your signup and access your workspace.";

    const year = new Date().getFullYear();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${heading}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; color: #18181b;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f5; width: 100%; margin: 0; padding: 48px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);">
          <tr>
            <td style="padding: 40px 40px 32px 40px;">
              <!-- Brand Wordmark -->
              <div style="margin-bottom: 28px;">
                <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 800; letter-spacing: 2px; color: #09090b; text-transform: uppercase; display: inline-block;">
                  AXORA<span style="color: #2563eb; font-size: 18px; line-height: 1;">.</span>
                </span>
              </div>

              <!-- Main Heading -->
              <h1 style="margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 20px; font-weight: 600; color: #09090b; line-height: 1.3; letter-spacing: -0.2px;">
                ${heading}
              </h1>

              <!-- Subtext -->
              <p style="margin: 0 0 28px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #52525b;">
                ${subtext}
              </p>

              <!-- OTP Block -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 0 0 28px 0;">
                <tr>
                  <td align="center" style="background-color: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 8px; padding: 18px 24px; text-align: center;">
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #18181b; display: inline-block; padding-left: 8px;">
                      ${otp}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Expiry / Security Note -->
              <p style="margin: 0 0 28px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; line-height: 1.6; color: #71717a;">
                This code will expire in 10 minutes. If you didn't request this email, you can safely ignore it.
              </p>

              <!-- Horizontal Divider Line & Footer Note -->
              <div style="border-top: 1px solid #e4e4e7; padding-top: 20px;">
                <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; line-height: 1.5; color: #71717a;">
                  &copy; ${year} Axora Platform Inc. &bull; Collaborative Workspace
                </p>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/**
 * Send an email using the Axora transporter with plain-text fallback
 * @param {Object} options
 * @param {string} options.to      - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.html    - HTML body content
 * @param {string} [options.text]  - Plain-text fallback version (auto-generated if omitted)
 */
const sendEmail = async ({ to, subject, html, text }) => {
    // Generate clean plain text fallback if not provided
    const plainText =
        text ||
        "Your Axora verification code. Please view this email in an HTML-compatible email client to see your code.";

    const mailOptions = {
        from: `"Axora" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        text: plainText,
    };

    return await transporter.sendMail(mailOptions);
};

module.exports = { sendEmail, buildOtpTemplate };
