'use strict';

const resolve = require('path').resolve;
const nodemailer = require('nodemailer');
const nodemailerhbs = require('nodemailer-express-handlebars');
const exphbs = require('express-handlebars');
//mailConfig = requere ('../config/mail');

class Mail {
  constructor() {
    //const { host, port, secure, auth } = mailConfig;

    this.transporter = nodemailer.createTransport({
      pool: false, // send large number of messages, don't forgot to close connection after sending all emails 
      maxConnections: 5, // Simultaneous connections to SMTP server. Default: 5
      maxMessages: 10, // Limit messages per connections. Default: 100
      //rateDelta: 1000,
      //rateLimit: 1000,
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      secure: process.env.MAIL_SECURE === 'true' ? true : false, // true for 465, false for other ports
      // tls:{ requireTLS : true }, // Tentara encriptar o email, caso contrario não enviara
      // logger: true, // Logar na tela dados do nodemailer
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD
      },
    });

    this.configureTemplates();
  }

  configureTemplates() {
    const viewPath = resolve(__dirname, '..', 'views', 'mail');

    this.transporter.use(
      'compile',
      nodemailerhbs({
        viewEngine: exphbs.create({
          layoutsDir: resolve(viewPath, 'layouts'),
          partialsDir: resolve(viewPath, 'partials'),
          defaultLayout: 'default',
          extname: '.hbs',
        }),
        viewPath,
        extName: '.hbs',
      })
    );
  }

  /**
   * Envia email
   * @param message Objeto contendo dados para envio de email.
   */
   sendMail(config) {
    let message = { ...config }
    message.context.companyName = process.env.COMPANY_NAME;
    message.context.companyLogo = process.env.COMPANY_LOGO;
    message.context.companySite = process.env.COMPANY_SITE;
    
    return this.transporter.sendMail({
      from: `${process.env.MAIL_SEND_AS_NAME} <${process.env.MAIL_SEND_AS_EMAIL}>`,
      ...message,
    });
  }

  /**
   * Verifica se servidor SMTP configurado esta apto a 
   * enviar seus E-Mails.
   */
  verifyServerIsOk(){
    this.transporter.verify(function(error, success) {
      if (error) return (error);
      else return(`O servidor configurado esta apto para enviar seus E-Mails: ${success}`);
    }); 
  }
}
module.exports = Mail;