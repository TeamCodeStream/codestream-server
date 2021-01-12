// provides a class through which to send particular email types

'use strict';

const SendGridEmail = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/sendgrid_email');
const SMTPEmail = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/smtp_email');

class EmailSender {

	constructor (options) {
		Object.assign(this, options);
		if (this.outboundEmailServer.config.emailDeliveryService.selected === 'NodeMailer') {
			this.smtpMailer = new SMTPEmail({
				...this.outboundEmailServer.config.emailDeliveryService.NodeMailer,
				emailTo: this.outboundEmailServer.config.email.emailTo
			});
		}
		else {
			this.sendgridEmail = new SendGridEmail({
				...this.outboundEmailServer.config.emailDeliveryService.sendgrid,
				emailTo: this.outboundEmailServer.config.email.emailTo
			});
		}
	}

	async sendEmail (options) {
		this.logger.debug('EmailSender.sendEmail()', options.requestId);
		if (this.smtpMailer) {
			return await this.sendSmtpEmail(options);
		}
		else if (this.sendgridEmail) {
			return await this.sendSendgridEmail(options);
		}
	}

	// given a user, figure out a full display name to use in the subject
	getUserDisplayName(user) {
		return user.fullName || user.email;
	}

	// mailer options common to all mailers
	getCommonMailOptions(options) {
		const { user, email, to, from, sender, subject, content, category, testCallback } = options;
		const envelope = {
			email: to ? to.email : (email || user.email),
			name: to ? to.name : this.getUserDisplayName(user),
			senderEmail: from ? from.email : this.outboundEmailServer.config.email.senderEmail,
			// senderEmail: from ? from.email : 
			// 	(sender ? sender.email : this.outboundEmailServer.config.email.supportEmail),
			senderName: from ? from.name :
				(sender ? this.getUserDisplayName(sender) : 'CodeStream'),
			subject,
			content,
			category,
			testCallback,
			testOptions: { user },
			logger: this.logger,
			requestId: options.requestId
		};
		return envelope;
	}

	async sendSendgridEmail (options) {
		this.logger.debug('EmailSender.sendSendgridEmail(options):', options.requestId, options);
		const { replyTo, type } = options;
		const mailOptions = this.getCommonMailOptions(options);
		mailOptions.from = { email: mailOptions.senderEmail, name: mailOptions.senderName };
		mailOptions.to = { email: mailOptions.email, name: mailOptions.name };
		if (replyTo) {
			mailOptions.replyTo = { email: replyTo, name: 'CodeStream' };
		}
		this.logger.debug('EmailSender.sendSendgridEmail(mailOptions):', options.requestId, mailOptions);
		this.logger.log(`Sending ${type} email through SendGrid to ${mailOptions.email}`, options.requestId);
		await this.sendgridEmail.sendEmail(mailOptions);
	}

	async sendSmtpEmail (options) {
		this.logger.debug('EmailSender.sendSmtpEmail(options):', options.requestId, options);
		const { replyTo, type } = options;
		const mailOptions = this.getCommonMailOptions(options);
		mailOptions.from = `"${mailOptions.senderName}" <${mailOptions.senderEmail}>`;
		mailOptions.to = `"${mailOptions.name}" <${mailOptions.email}>`;
		if (replyTo) {
			mailOptions.replyTo = `"CodeStream" <${replyTo}>`;
		}
		this.logger.debug('EmailSender.sendSmtpEmail(mailOptions):', options.requestId, mailOptions);
		this.logger.log(`Sending ${type} email through SMTP to ${mailOptions.email}`, options.requestId);
		await this.smtpMailer.sendEmail(mailOptions);
	}
}

module.exports = EmailSender;
