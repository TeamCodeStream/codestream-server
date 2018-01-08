// wrapper class for sending emails through SendGrid (sendgrid.com)

'use strict';

var SendGrid = require('sendgrid');
var ErrorHandler = require(process.env.CS_API_TOP + '/lib/util/error_handler');
const Errors = require('./errors');

class SendGridEmail {

	constructor (options) {
		Object.assign(this, options);
		this.sendgrid = SendGrid(this.apiKey);
		this.errorHandler = new ErrorHandler(Errors);
	}

	// send an email through SendGrid
	sendEmail (options, callback) {
		let request = this.createMailRequest(options);
		if (this.checkBlocking(request, options, callback)) {
			// we're blocking email sends for some reason, so don't proceed
			return;
		}

		// clear to send...
		this.sendgrid.API(
			request,
			(error, response) => {
				if (error) {
					return callback(this.errorHandler.error('email', { reason: `error calling sendgrid API: ${error}` }));
				}
				else if (response.statusCode >= 300) {
					return callback(this.errorHandler.error('email', { reason: `got status ${response.statusCode} calling sendgrid API` }));
				}
		  		callback();
			}
		);
	}

	// check if we're blocking email sends for some reason, if we are, this will
	// call the callback, if we're not, it won't
	checkBlocking (request, options, callback) {
		if (this.requestSaysToTestEmails(options)) {
			// we received a header in the request asking us to divert this email
			// instead of actually sending it, for testing purposes ... we'll
			// emit the request body to the callback provided
			if (options.request) {
				options.request.log(`Diverting email for ${JSON.stringify(options.to)} to test callback`);
			}
			if (options.testCallback) {
				options.testCallback(request.body, options.user, options.request);
			}
			process.nextTick(callback);
			return true;
		}
		else if (!this.emailTo || this.requestSaysToBlockEmails(options)) {
			if (options.request && !this.emailTo && !options.request.api.config.api.confirmationNotRequired) {
				// we throw an error here, it's a configuration (and the default one for developer machines)
				// that makes it impossible to actually register a new user
				const error = 'Attempt to block emails while confirmation is required: turn on emails or turn off the confirmation requirement';
				callback(error);
				return true;
			}
			else {
				// we are configured not to actually send out emails, just drop it to the floor
				if (options.request) {
					options.request.log(`Would have sent to ${JSON.stringify(options.to)}: ${options.subject}`);
				}
				process.nextTick(callback);
				return true;
			}
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

		if (this.emailTo && this.emailTo !== 'on' && !this.requestSaysToTestEmails(options)) {
			// we're going to divert this email to a particular address (usually for developer testing)
			// we'll put the real email address in the subject for debugging
			subject = `{{{${to}}}} ${subject}`;
			to = this.emailTo;
			if (options.request) {
				options.request.log(`Diverting to ${to}`);
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

	// determine if special header was sent with the request that says to test emails,
	// meaning we'll not actually send them out but send them through a pubnub channel
	// to verify content
	requestSaysToTestEmails (options) {
		return (
			options.request &&
			options.request.request &&
			options.request.request.headers &&
			options.request.request.headers['x-cs-test-email-sends']
		);
	}
}

module.exports = SendGridEmail;
