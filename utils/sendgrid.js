const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");

const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key: process.env.SENDGRID_API_KEY,
    },
  })
);

module.exports = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      to: to,
      from: "noreply@raspiface-utility.com",
      subject: subject,
      html: html,
    });
  } catch (err) {
    throw err;
  }
};
