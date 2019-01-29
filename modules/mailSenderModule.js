const config = require('../config');
const nodemailer = require('nodemailer');
const Email = require('email-templates');

const MailSenderModule = (function(){
    const transporter = nodemailer.createTransport(config.google.mailTransporter);
    const email = new Email({
        message: {
            from: config.google.mailFrom
        },
        transport: transporter,
        views: { options: { extension: 'ejs' } },
        preview: false,
        send: true
    });

    return {
        sendMail: async function (contents) {
            try {
                return await email.send(contents);
            }
            catch (error) {
                throw error;
            }
        }
    }
})();

module.exports = MailSenderModule;
