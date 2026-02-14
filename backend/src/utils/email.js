const nodemailer = require("nodemailer");

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

async function sendPingEmail({ to, fromUserName, fromUserEmail }) {
  const transporter = createTransporter();
  if (!transporter) {
    throw new Error("Email service is not configured");
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const subject = "You got a ping 💌";
  const text = `${fromUserName || "Someone"} pinged you.`;
  const html = `<p><strong>${fromUserName || "Someone"}</strong> pinged you.</p><p>From: ${fromUserEmail || "unknown"}</p>`;

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
}

module.exports = {
  sendPingEmail,
};
