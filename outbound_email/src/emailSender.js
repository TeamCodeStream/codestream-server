// provides a class through which to send particular email types

'use strict';

const SendGridEmail = require('./server_utils/sendgrid_email');
const EmailUtilities = require('./server_utils/email_utilities');
const Config = require('./config');

class EmailSender {

	constructor (options) {
		Object.assign(this, options);
		this.sendgridEmail = new SendGridEmail(Config.sendgrid);
	}

	async sendEmail (options) {
console.warn('options', options);
		const { user, to, from, sender, replyTo, subject, content, type, testCallback } = options;
		const email = to ? to.email : user.email;
		const name = to ? to.name : this.getUserDisplayName(user);
		const senderEmail = from ? from.email : 
			(sender ? sender.email : Config.supportEmail);
		const senderName = from ? from.name :
			(sender ? this.getUserDisplayName(sender) : 'CodeStream');
		const sendgridOptions = {
			from: { email: senderEmail, name: senderName },
			to: { email, name },
			subject,
			content,
			testCallback,
			testOptions: { user },
			logger: this.logger
		};
		if (replyTo) {
			sendgridOptions.replyTo = { email: replyTo, name: 'CodeStream' };
		}

		this.logger.log(`Sending ${type} email to ${email}`);
		await this.sendgridEmail.sendEmail(sendgridOptions);
	}

	// given a user, figure out a full display name to use in the subject
	getUserDisplayName (user) {
		return user.fullName || user.email;
	}

	// given a user, figure out a username to use in the subject
	getUsername (user) {
		if (user.username) {
			return user.username;
		}
		const parsed = EmailUtilities.parseEmail(user.email);
		if (typeof parsed === 'object') {
			return parsed.name;
		}
		else {
			return user.email;
		}
	}
}

module.exports = EmailSender;
