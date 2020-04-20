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
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD
      },
    });

    this.configureTemplates();
  }

  configureTemplates() {
    const viewPath = resolve(__dirname, '..', 'api', 'resource', 'mail');

    this.transporter.use(
      'compile',
      nodemailerhbs({
        viewEngine: exphbs.create({
          // layoutsDir: resolve(viewPath, 'layouts'),
          layoutsDir: resolve(viewPath, 'contratos'),
          // partialsDir: resolve(viewPath, 'partials'),
          partialsDir: resolve(viewPath, 'contratos'),
          defaultLayout: 'default',
          // extname: '.hbs',
          extname: '.html',
        }),
        viewPath,
        // extName: '.hbs',
        extName: '.html',
      })
    );
  }

  sendMail(message) {
    return this.transporter.sendMail({
      from: 'Administradores <alert@mybusiness.com>',
      ...message,
    });
  }
}
module.exports = new Mail();