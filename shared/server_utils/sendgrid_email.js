// wrapper class for sending emails through SendGrid (sendgrid.com)

'use strict';

const SendGrid = require('sendgrid');
const AwaitUtils = require('./await_utils');

class SendGridEmail {

	constructor (options) {
		Object.assign(this, options);
		this.sendgrid = SendGrid(this.apiKey);
	}

	// send an email through SendGrid
	async sendEmail (options) {
		let request = this.createMailRequest(options);
		if (this.checkBlocking(request, options)) {
			// we're blocking email sends for some reason, so don't proceed
			return;
		}

		// clear to send...
		let response;
		let i;
		const email = request.body.personalizations[0].to[0].email;
		for (i = 0; i < 3; i++) {
			try {
				if (options.logger) {
					options.logger.log(`Calling SendGrid API to send email to: ${email}`, options.requestId);
				}
				response = await AwaitUtils.callbackWrap(
					this.sendgrid.API.bind(this.sendgrid),
					request
				);
			}
			catch (error) {
				if (options.logger) {
					options.logger.error(`Error calling sendgrid API: ${JSON.stringify(error)}`);
				}
				continue;
			}
			if (response.statusCode >= 300) {
				if (options.logger) {
					options.logger.log(`Got status ${response.statusCode} sending email to ${email}`, options.requestId);
				}
				throw `got status ${response.statusCode} calling sendgrid API`;
			}
			else {
				break;
			}
		}
		if (i < 3) {
			if (options.logger) {
				options.logger.log(`Successfully sent email to ${email}`, options.requestId);
			}
		}
		else {
			if (options.logger) {
				options.logger.log(`Failed to send email to ${email} after 3 tries`, options.requestId);
			}
		}
	}

	// check if we're blocking email sends for some reason
	checkBlocking (request, options) {
		if (options.testCallback) {
			// we received a header in the request asking us to divert this email
			// instead of actually sending it, for testing purposes ... we'll
			// emit the request body to the callback provided
			if (options.logger) {
				options.logger.log(`Diverting email for ${JSON.stringify(options.to)} to test callback`, options.requestId);
			}
			options.testCallback(request.body, options.testOptions);
			return true;
		}
		else if (this.requestSaysToBlockEmails(options)) {
			// we are configured not to actually send out emails, just drop it to the floor
			if (options.logger) {
				options.logger.log(`Would have sent to ${JSON.stringify(options.to)}: ${options.subject}`, options.requestId);
			}
			return true;
		}
	}

	// create the mail request object required by SendGrid
	createMailRequest (options) {
		let mail = this.createMailObject(options);
		return this.sendgrid.emptyRequest({
			method: 'POST',
			path: this.url,
			body: mail.toJSON(),
		});
	}

	// create the mail object required by SendGrid
	createMailObject (options) {
		let helper = SendGrid.mail;
		let from = typeof options.from === 'object' ? options.from.email : options.from;
		let fromName = typeof options.from === 'object' ? options.from.name : null;
		let fromEmail = new helper.Email(from, fromName);
		let subject = options.subject || ' ';
		let to = typeof options.to === 'object' ? options.to.email : options.to;
		let toName = typeof options.to === 'object' ? options.to.name : null;

		if (this.emailTo && !options.testCallback) {
			// we're going to divert this email to a particular address (usually for developer testing)
			// we'll put the real email address in the subject for debugging
			subject = `{{{${to}}}} ${subject}`;
			to = this.emailTo;
			if (options.logger) {
				options.logger.log(`Diverting to ${to}`, options.requestId);
			}
		}

		let toEmail = new helper.Email(to, toName);
		let content = new helper.Content('text/html', options.content || '<html></html>');
		let mail = new helper.Mail(fromEmail, subject, toEmail, content);
		if (options.replyTo) {
			let replyTo = typeof options.replyTo === 'object' ? options.replyTo.email : options.replyTo;
			let replyToName = typeof options.replyTo === 'object' ? options.replyTo.name : null;
			let replyToEmail = new helper.Email(replyTo, replyToName);
			mail.setReplyTo(replyToEmail);
		}

		// add any fields to the template for substitution
		Object.keys(options.fields || {}).map(field => {
			mail.personalizations[0].addSubstitution(
				new helper.Substitution(
					'{{' + field + '}}',
					options.fields[field]
				)
			);
		});
		
		// each email type has its own template ID
		mail.setTemplateId(options.templateId);

		// add category as needed
		if (options.category) {
			mail.addCategory({ category: options.category });
		}

		return mail;
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

module.exports = SendGridEmail;
