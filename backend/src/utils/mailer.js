import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host:     process.env.SMTP_HOST,
  port:     Number(process.env.SMTP_PORT),
  secure:   false,            // true if you use port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function sendEmail(to, subject, text) {
  await transporter.sendMail({
    from:    `"Task Manager" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text
  });
}
