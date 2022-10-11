// wrapper class for sending emails through SendGrid (sendgrid.com)

'use strict';

const SendGrid = require('@sendgrid/mail');
const EmailUtilities = require('./email_utilities');

class SendGridEmail {

	constructor (options) {
		Object.assign(this, options);
		this.sendgrid = SendGrid;
		this.sendgrid.setApiKey(this.apiKey);
	}

	// send an email through SendGrid
	async sendEmail (options) {
		// create the message object to send to SendGrid
		const message = this.createMessage(options);

		if (this.checkBlocking({ body: message }, options)) {
			// we're blocking email sends for some reason, so don't proceed
			return;
		}

		// pre-empt sending to invalid emails 
		const email = typeof options.to === 'object' ? options.to.email : options.to;
		const parts = EmailUtilities.parseEmail(email);
		if (typeof parts !== 'object') {
			this.log(`Not sending to invalid email ${email}: ${parts}`, options.requestId);
			return;
		}
		if (email.match(/noreply\.github\.com$/)) {
			this.log(`Not sending to "no-reply" email ${email}`, options.requestId);
			return;
		}

		// clear to send...
		let response;
		let i;
		for (i = 0; i < 3; i++) {
			try {
				this.log(`Calling SendGrid API to send email to: ${email}`, options.requestId);
				response = await this.sendgrid.send(message);
			}
			catch (error) {
				const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
				this.error(`Error calling sendgrid API: ${errorMessage}`, options.requestId);
				continue;
			}
			if (response.statusCode >= 300) {
				this.log(`Got status ${response.statusCode} sending email to ${email}`, options.requestId);
				throw `got status ${response.statusCode} calling sendgrid API`;
			}
			else {
				break;
			}
		}
		if (i < 3) {
			this.log(`Successfully sent email to ${email}`, options.requestId);
		}
		else {
			this.log(`Failed to send email to ${email} after 3 tries`, options.requestId);
		}
	}

	// check if we're blocking email sends for some reason
	checkBlocking (request, options) {
		if (options.testCallback) {
			// we received a header in the request asking us to divert this email
			// instead of actually sending it, for testing purposes ... we'll
			// emit the request body to the callback provided
			this.log(`Diverting email for ${JSON.stringify(options.to)} to test callback`, options.requestId);
			options.testCallback(request.body, options.testOptions);
			return true;
		}
		else if (this.requestSaysToBlockEmails(options)) {
			// we are configured not to actually send out emails, just drop it to the floor
			this.log(`Would have sent to ${JSON.stringify(options.to)}: ${options.subject}`, options.requestId);
			return true;
		}
	}

	// create the mail message object to send to SendGrid
	createMessage (options) {
		const message = {
			to: options.to,
			from: options.from,
			replyTo: options.replyTo,
			subject: options.subject || '',
			text: options.text || options.content || options.html || '???',
			html: options.content || options.html || '',
			category: options.category || undefined,
			templateId: options.templateId
		}

		const to = typeof options.to === 'object' ? options.to.email : options.to;
		if (this.emailTo && !options.testCallback) {
			// we're going to divert this email to a particular address (usually for developer testing)
			// we'll put the real email address in the subject for debugging
			message.subject = `{{{${to}}}} ${message.subject}`;
			message.to = this.emailTo;
			this.log(`Diverting to ${message.to}`, options.requestId);
		}

		return message;
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

	log (msg, requestId) {
		if (this.logger) {
			this.logger.log(msg, requestId);
		}
	}

	error (msg, requestId) {
		if (this.logger) {
			this.logger.error(msg, requestId);
		}
	}
}

module.exports = SendGridEmail;
