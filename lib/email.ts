import nodemailer from 'nodemailer';

// For now, we'll just log to console as requested by the user.
// In a real app, we would configure a transporter.

export async function sendEmail(to: string, subject: string, html: string) {
    console.log(`[Email Service] Sending email to ${to}`);

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('[Email Service] Missing EMAIL_USER or EMAIL_PASS. Logging to console only.');
        console.log(`[Email Service] Subject: ${subject}`);
        console.log(`[Email Service] Body Length: ${html.length}`);
        return true;
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail', // Default to Gmail for simplicity, can be changed to generic SMTP
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    try {
        await transporter.sendMail({
            from: `"NewsPulse" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        });
        console.log(`[Email Service] Email sent successfully to ${to}`);
        return true;
    } catch (error) {
        console.error('[Email Service] Failed to send email:', error);
        return false;
    }
}
