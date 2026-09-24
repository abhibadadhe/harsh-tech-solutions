const nodemailer = require('nodemailer');

/**
 * Creates and configures the Nodemailer transporter.
 * Uses Gmail service by default (with Google App Password),
 * or custom SMTP if SMTP_HOST is provided in .env.
 */
function createTransporter() {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!user || !pass) {
        return null;
    }

    // Support custom SMTP (e.g., Hostinger, Zoho, cPanel, etc.)
    if (process.env.SMTP_HOST) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587', 10),
            secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
            auth: { user, pass }
        });
    }

    // Default: Gmail service with Google App Password
    return nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass }
    });
}

/**
 * Generates modern, responsive HTML for the Admin Notification email.
 */
function buildAdminNotificationHtml({ name, email, phone, subject, message, dateFormatted }) {
    const cleanPhone = (phone || '').replace(/[^0-9+]/g, '');
    const waNumber = cleanPhone.replace(/^\+/, '');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Website Inquiry</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6fb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f6fb; padding: 30px 15px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 620px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #4338ca 0%, #6366f1 100%); padding: 32px 30px; text-align: center;">
                            <div style="font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #c7d2fe; margin-bottom: 6px;">Harsh Tech Solutions</div>
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700; line-height: 1.3;">🔔 New Contact Lead</h1>
                            <p style="margin: 8px 0 0 0; color: #e0e7ff; font-size: 14px;">A customer submitted an inquiry on harshtechsolutions.in</p>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 32px 30px;">
                            <!-- Details Card -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 24px;">
                                <tr>
                                    <td style="padding: 14px 20px; border-bottom: 1px solid #e2e8f0; width: 35%; font-weight: 600; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Customer Name</td>
                                    <td style="padding: 14px 20px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0f172a; font-size: 15px;">${name}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 14px 20px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Email</td>
                                    <td style="padding: 14px 20px; border-bottom: 1px solid #e2e8f0; font-size: 15px;">
                                        <a href="mailto:${email}" style="color: #4f46e5; text-decoration: none; font-weight: 500;">${email}</a>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 14px 20px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Phone Number</td>
                                    <td style="padding: 14px 20px; border-bottom: 1px solid #e2e8f0; font-size: 15px;">
                                        <a href="tel:${cleanPhone}" style="color: #4f46e5; text-decoration: none; font-weight: 500;">${phone}</a>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 14px 20px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Service / Inquiry</td>
                                    <td style="padding: 14px 20px; border-bottom: 1px solid #e2e8f0; font-size: 15px;">
                                        <span style="display: inline-block; background: #e0e7ff; color: #3730a3; padding: 4px 10px; border-radius: 999px; font-weight: 600; font-size: 13px;">${subject || 'General Inquiry'}</span>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 14px 20px; font-weight: 600; color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Received At</td>
                                    <td style="padding: 14px 20px; font-size: 14px; color: #64748b;">${dateFormatted}</td>
                                </tr>
                            </table>

                            <!-- Message Section -->
                            <div style="margin-bottom: 28px;">
                                <div style="font-weight: 700; color: #0f172a; font-size: 15px; margin-bottom: 8px;">Customer Message:</div>
                                <div style="background-color: #f1f5f9; border-left: 4px solid #6366f1; padding: 16px 20px; border-radius: 0 8px 8px 0; color: #334155; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${message}</div>
                            </div>

                            <!-- Action Buttons -->
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td align="center" style="padding-top: 10px;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                            <tr>
                                                <td style="border-radius: 6px; background-color: #4f46e5; margin: 4px;">
                                                    <a href="mailto:${email}?subject=Re:%20Inquiry%20regarding%20${encodeURIComponent(subject || 'Harsh Tech Solutions')}" style="padding: 12px 22px; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; display: inline-block; border-radius: 6px;">Reply to Customer</a>
                                                </td>
                                                <td style="width: 12px;"></td>
                                                <td style="border-radius: 6px; background-color: #059669; margin: 4px;">
                                                    <a href="tel:${cleanPhone}" style="padding: 12px 22px; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; display: inline-block; border-radius: 6px;">Call Customer</a>
                                                </td>
                                                ${waNumber ? `
                                                <td style="width: 12px;"></td>
                                                <td style="border-radius: 6px; background-color: #25d366; margin: 4px;">
                                                    <a href="https://wa.me/${waNumber}" target="_blank" style="padding: 12px 22px; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; display: inline-block; border-radius: 6px;">WhatsApp</a>
                                                </td>
                                                ` : ''}
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
                            This automated alert was dispatched by Harsh Tech Solutions backend system.<br>
                            Baner, Pune, Maharashtra, India
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
}

/**
 * Generates modern, premium HTML for the Customer Confirmation / Thank-you email.
 */
function buildCustomerConfirmationHtml({ name, subject, message }) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thank You for Contacting Harsh Tech Solutions</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6fb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f6fb; padding: 30px 15px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 36px 32px; text-align: center;">
                            <div style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                                Harsh Tech <span style="color: #818cf8;">Solutions</span>
                            </div>
                            <p style="margin: 8px 0 0 0; color: #c7d2fe; font-size: 14px;">Web • Custom Software • SaaS • Digital Automation</p>
                        </td>
                    </tr>

                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 36px 32px;">
                            <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 20px; font-weight: 700;">Hello ${name}, 👋</h2>
                            <p style="margin: 0 0 16px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                                Thank you for contacting <strong>Harsh Tech Solutions</strong>! We have received your inquiry regarding <strong>${subject || 'our services'}</strong> and our team is already reviewing your details.
                            </p>

                            <!-- Inquiry summary box -->
                            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
                                <div style="font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Inquiry Summary</div>
                                <div style="font-size: 14px; color: #0f172a; margin-bottom: 8px;"><strong>Service:</strong> ${subject || 'General Inquiry'}</div>
                                <div style="font-size: 14px; color: #475569; line-height: 1.5; white-space: pre-wrap;"><strong>Your Note:</strong> "${message}"</div>
                            </div>

                            <!-- Next Steps -->
                            <div style="margin-bottom: 28px;">
                                <h3 style="margin: 0 0 12px 0; color: #0f172a; font-size: 16px; font-weight: 700;">What happens next?</h3>
                                <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 14px; line-height: 1.8;">
                                    <li>Our technical consulting team will analyze your project requirements.</li>
                                    <li>We will get in touch with you within <strong>24 business hours</strong> with initial recommendations or a consultation call.</li>
                                </ul>
                            </div>

                            <!-- Urgent contact box -->
                            <div style="background-color: #eef2ff; border-radius: 8px; padding: 18px 20px; margin-bottom: 28px; border-left: 4px solid #6366f1;">
                                <div style="font-weight: 700; color: #3730a3; font-size: 14px; margin-bottom: 6px;">Need urgent assistance or have questions right now?</div>
                                <div style="color: #4338ca; font-size: 14px; line-height: 1.6;">
                                    📞 Call / WhatsApp: <a href="tel:+919028553395" style="color: #4338ca; font-weight: 600; text-decoration: underline;">+91 90285 53395</a><br>
                                    ✉️ Direct Email: <a href="mailto:abhibadadhe@harshtechsolutions.in" style="color: #4338ca; font-weight: 600; text-decoration: underline;">abhibadadhe@harshtechsolutions.in</a>
                                </div>
                            </div>

                            <!-- Signoff -->
                            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; color: #64748b; font-size: 14px; line-height: 1.6;">
                                Warm regards,<br>
                                <strong style="color: #0f172a;">Abhishek Badadhe</strong><br>
                                Founder, Harsh Tech Solutions<br>
                                <span style="font-size: 13px; color: #94a3b8;">Baner, Pune, Maharashtra, India</span>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8fafc; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
                            © ${new Date().getFullYear()} Harsh Tech Solutions. All rights reserved.<br>
                            Empowering businesses with custom software, websites, and automation.
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
}

/**
 * Sends both the admin alert email and the customer confirmation email.
 * Non-blocking, fails gracefully if credentials are not configured.
 *
 * @param {Object} contact
 * @param {string} contact.name
 * @param {string} contact.email
 * @param {string} contact.phone
 * @param {string} contact.subject
 * @param {string} contact.message
 */
async function sendContactEmails({ name, email, phone, subject, message }) {
    const transporter = createTransporter();

    if (!transporter) {
        console.warn('⚠️ [Email Service] EMAIL_USER and/or EMAIL_PASS not set in environment. Skipping email notification.');
        return {
            sent: false,
            reason: 'EMAIL_USER or EMAIL_PASS not configured in .env'
        };
    }

    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'abhibadadhe@harshtechsolutions.in';
    const senderAddress = process.env.EMAIL_FROM || `"Harsh Tech Solutions" <${process.env.EMAIL_USER}>`;

    const dateFormatted = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short'
    });

    // 1. Prepare Admin Notification Email
    const adminMailOptions = {
        from: senderAddress,
        to: adminEmail,
        replyTo: `"${name}" <${email}>`,
        subject: `🔔 New Contact Lead: ${name} (${subject || 'General Inquiry'})`,
        text: `New Lead Submitted on Harsh Tech Solutions Website:\n\nName: ${name}\nEmail: ${email}\nPhone: ${phone}\nSubject: ${subject}\nTime: ${dateFormatted}\n\nMessage:\n${message}`,
        html: buildAdminNotificationHtml({ name, email, phone, subject, message, dateFormatted })
    };

    // 2. Prepare Customer Confirmation Email
    const customerMailOptions = {
        from: senderAddress,
        to: email,
        replyTo: adminEmail,
        subject: `Thank you for contacting Harsh Tech Solutions!`,
        text: `Hi ${name},\n\nThank you for reaching out to Harsh Tech Solutions! We have received your inquiry regarding "${subject || 'our services'}".\n\nOur team is reviewing your message and will reach out to you within 24 business hours.\n\nNeed urgent assistance?\nCall/WhatsApp: +91 90285 53395\nEmail: abhibadadhe@harshtechsolutions.in\n\nWarm regards,\nAbhishek Badadhe\nHarsh Tech Solutions`,
        html: buildCustomerConfirmationHtml({ name, subject, message })
    };

    try {
        console.log(`[Email Service] Sending notification to admin (${adminEmail}) and confirmation to customer (${email})...`);

        const [adminResult, customerResult] = await Promise.allSettled([
            transporter.sendMail(adminMailOptions),
            transporter.sendMail(customerMailOptions)
        ]);

        if (adminResult.status === 'fulfilled') {
            console.log(`✅ [Email Service] Admin notification sent successfully (ID: ${adminResult.value.messageId})`);
        } else {
            console.error(`❌ [Email Service] Failed to send admin notification:`, adminResult.reason?.message || adminResult.reason);
        }

        if (customerResult.status === 'fulfilled') {
            console.log(`✅ [Email Service] Customer confirmation sent successfully (ID: ${customerResult.value.messageId})`);
        } else {
            console.error(`❌ [Email Service] Failed to send customer confirmation:`, customerResult.reason?.message || customerResult.reason);
        }

        return {
            sent: adminResult.status === 'fulfilled' || customerResult.status === 'fulfilled',
            adminSent: adminResult.status === 'fulfilled',
            customerSent: customerResult.status === 'fulfilled'
        };
    } catch (err) {
        console.error(`❌ [Email Service] Unexpected error in mailer:`, err.message);
        return {
            sent: false,
            error: err.message
        };
    }
}

module.exports = {
    sendContactEmails
};
