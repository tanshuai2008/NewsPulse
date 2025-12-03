import nodemailer from 'nodemailer';

// For now, we'll just log to console as requested by the user.
// In a real app, we would configure a transporter.

export async function sendEmail(to: string, subject: string, html: string) {
    console.log(`[Email Service] Sending email to ${to}`);
    console.log(`[Email Service] Subject: ${subject}`);
    console.log(`[Email Service] Body Length: ${html.length}`);

    // Mock sending
    // const transporter = nodemailer.createTransport({ ... });
    // await transporter.sendMail({ ... });

    return true;
}
