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
		if (this.smtpMailer) {
			return await this.sendSmtpEmail(options);
		}
		else if (this.sendgridEmail) {
			return await this.sendSendgridEmail(options);
		}
	}

	async sendSendgridEmail (options) {
		const { user, to, from, sender, replyTo, subject, content, type, testCallback } = options;
		const email = to ? to.email : user.email;
		const name = to ? to.name : this.getUserDisplayName(user);
		const senderEmail = from ? from.email : 
			(sender ? sender.email : Config.supportEmail);
		const senderName = from ? from.name :
			(sender ? this.getUserDisplayName(sender) : 'CodeStream');
		const mailOptions = {
			from: { email: senderEmail, name: senderName },
			to: { email, name },
			subject,
			content,
			testCallback,
			testOptions: { user },
			logger: this.logger
		};
		if (replyTo) {
			mailOptions.replyTo = { email: replyTo, name: 'CodeStream' };
		}

		this.logger.log(`Sending ${type} email through SendGrid to ${email}`);
		await this.sendgridEmail.sendEmail(mailOptions);
	}

	async sendSmtpEmail (options) {
		const { user, to, from, sender, replyTo, subject, content, type, testCallback } = options;
		const email = to ? to.email : user.email;
		const name = to ? to.name : this.getUserDisplayName(user);
		const senderEmail = from ? from.email : 
			(sender ? sender.email : Config.supportEmail);
		const senderName = from ? from.name :
			(sender ? this.getUserDisplayName(sender) : 'CodeStream');
		const mailOptions = {
			from: `"${senderName}" <${senderEmail}>`,
			to: `"${name}" <${email}>`,
			subject,
			content,
			testCallback,
			testOptions: { user },
			logger: this.logger
		};
		if (replyTo) {
			mailOptions.replyTo = `"CodeStream" <${replyTo}>`;
		}

		this.logger.log(`Sending ${type} email through SMTP to ${email}`);
		await this.smtpMailer.sendEmail(mailOptions);
	}

	// given a user, figure out a full display name to use in the subject
	getUserDisplayName (user) {
		return user.fullName || user.email;
	}
}

module.exports = EmailSender;
