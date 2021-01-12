// thin wrapper class for sending emails through SMTP

'use strict';

const NodeMailer = require('nodemailer');

class SMTPEmail {

	constructor (config) {
		this.config = config;
	}

	async init () {
		const transportOptions = {
			service: this.config.service,
			host: this.config.host,
			port: this.config.port,
			secure: this.config.secure
		};
		if (this.config.username) {
			transportOptions.auth = {
				user: this.config.username,
				pass: this.config.password
			};
		}
		this.nodeMailer = NodeMailer.createTransport(transportOptions);
	}

	// send an email through SMTP
	async sendEmail (options) {
		if (!this.nodeMailer) {
			await this.init();
		}

		if (this.checkBlocking(options)) {
			// we're blocking email sends for some reason, so don't proceed
			return;
		}

		if (this.config.emailTo) {
			// we're going to divert this email to a particular address (usually for developer testing)
			// we'll put the real email address in the subject for debugging
			options.subject = `{{{${options.to}}}} ${options.subject}`;
			options.to = this.config.emailTo;
			if (options.logger) {
				options.logger.log(`Diverting to ${options.to}`);
			}
		}

		// clear to send...
		let result;
		try {
			if (options.logger) {
				options.logger.log(`Calling SMTP host to send email to: ${options.to}`);
			}
			result = await this.nodeMailer.sendMail({
				to: options.to,
				from: options.from,
				replyTo: options.replyTo,
				subject: options.subject,
				html: options.content
			});
		}
		catch (error) {
			if (options.logger) {
				options.logger.error(`Error making SMTP request: ${JSON.stringify(error)}`);
			}
			return;
		}

		if (options.logger) {
			options.logger.log(`Successfully sent email to ${options.to}, messageId=${result.messageId}`);
		}
	}

	// check if we're blocking email sends for some reason
	checkBlocking (options) {
		if (options.testCallback) {
			// we received a header in the request asking us to divert this email
			// instead of actually sending it, for testing purposes ... we'll
			// emit the request body to the callback provided
			if (options.logger) {
				options.logger.log(`Diverting email for ${JSON.stringify(options.to)} to test callback`);
			}
			options.testCallback(options, options.testOptions);
			return true;
		}
		else if (this.requestSaysToBlockEmails(options)) {
			// we are configured not to actually send out emails, just drop it to the floor
			if (options.logger) {
				options.logger.log(`Would have sent to ${JSON.stringify(options.to)}: ${options.subject}`);
			}
			return true;
		}
	}

	// determine if special header was sent with the request that says to block emails
	requestSaysToBlockEmails (options) {
		return (
			options.request &&
			options.request.request &&
			options.request.request.headers &&
			options.request.request.headers['x-cs-block-email-sends']
		);
	}
}

module.exports = SMTPEmail;
