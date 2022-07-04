import nodemailer from 'nodemailer'

// async..await is not allowed in global scope, must use a wrapper
export default async function sendEmail(to : string[], html: string) {
  // create reusable transporter object using the default SMTP transport
  let testAccount = await nodemailer.createTestAccount();
  // console.log(to)
  let transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      // user: 'ycbitzz7eim7cger@ethereal.email', // generated ethereal user
      // pass: 'XX8SDqPwdtjQes5VuK', // generated ethereal password
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass, // generated ethereal password
    },
    tls: {
      rejectUnauthorized: false //Avoid nodejs self signed certificate error
    }
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: 'lqtuan.dev@gmail.com', // sender address
    to: to, // list of receivers
    subject: "Change password reddit", // Subject line
    // text: "Hello world?", // plain text body
    html: html, // html body
  });

  console.log("Message sent: %s", info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  // Preview only available when sending through an Ethereal account
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}