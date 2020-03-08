// provides a class through which to send particular email types

'use strict';

const SendGridEmail = require('./server_utils/sendgrid_email');
const SMTPEmail = require('./server_utils/smtp_email');
const Config = require('./config');

class EmailSender {

	constructor (options) {
		Object.assign(this, options);
		if (Config.smtp && (Config.smtp.host || Config.smtp.service)) {
			this.smtpMailer = new SMTPEmail(Config.smtp);
		}
		else {
			this.sendgridEmail = new SendGridEmail(Config.sendgrid);
		}
	}

	async sendEmail (options) {
		this.logger.debug('EmailSender.sendEmail()', this.request_id);
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
		const { user, to, from, sender, subject, content, testCallback } = options;
		const envelope = {
			email: to ? to.email : user.email,
			name: to ? to.name : this.getUserDisplayName(user),
			senderEmail: from ? from.email : Config.senderEmail,
			// senderEmail: from ? from.email : 
			// 	(sender ? sender.email : Config.supportEmail),
			senderName: from ? from.name :
				(sender ? this.getUserDisplayName(sender) : 'CodeStream'),
			subject,
			content,
			testCallback,
			testOptions: { user },
			logger: this.logger
		};
		return envelope;
	}

	async sendSendgridEmail (options) {
		this.logger.debug('EmailSender.sendSendgridEmail(options):', this.request_id, options);
		const { replyTo, type } = options;
		const mailOptions = this.getCommonMailOptions(options);
		mailOptions.from = { email: mailOptions.senderEmail, name: mailOptions.senderName };
		mailOptions.to = { email: mailOptions.email, name: mailOptions.name };
		if (replyTo) {
			mailOptions.replyTo = { email: replyTo, name: 'CodeStream' };
		}
		this.logger.debug('EmailSender.sendSendgridEmail(mailOptions):', this.request_id, mailOptions);
		this.logger.log(`Sending ${type} email through SendGrid to ${mailOptions.email}`);
		await this.sendgridEmail.sendEmail(mailOptions);
	}

	async sendSmtpEmail (options) {
		this.logger.debug('EmailSender.sendSmtpEmail(options):', this.request_id, options);
		const { replyTo, type } = options;
		const mailOptions = this.getCommonMailOptions(options);
		mailOptions.from = `"${mailOptions.senderName}" <${mailOptions.senderEmail}>`;
		mailOptions.to = `"${mailOptions.name}" <${mailOptions.email}>`;
		if (replyTo) {
			mailOptions.replyTo = `"CodeStream" <${replyTo}>`;
		}
		this.logger.debug('EmailSender.sendSmtpEmail(mailOptions):', this.request_id, mailOptions);
		this.logger.log(`Sending ${type} email through SMTP to ${mailOptions.email}`);
		await this.smtpMailer.sendEmail(mailOptions);
	}
}

module.exports = EmailSender;
