const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');

const transport = nodemailer.createTransport(sendgridTransport({
    auth: {
        api_key: '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'
    }
}));

module.exports = transport;