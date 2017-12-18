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
		if (!this.emailTo) {
			// we are configured not to actually send out emails, just drop it to the floor
			if (options.request) {
				options.request.log(`Would have sent to ${options.to}: ${options.subject}`);
			}
			return process.nextTick(callback);
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
		let fromEmail = new helper.Email(options.from);
		let subject = options.subject || '';
		let to = options.to;
		if (this.emailTo && this.emailTo !== 'on') {
			// we're going to divert this email to a particular address (usually for developer testing)
			// we'll put the real email address in the subject for debugging
			subject = `{{{${to}}}} ${subject}`;
			to = this.emailTo;
			if (options.request) {
				options.request.log(`Diverting to ${to}`);
			}
		}
		let toEmail = new helper.Email(to);
		let content = new helper.Content('text/html', options.content || '<html></html>');
		let mail = new helper.Mail(fromEmail, subject || '', toEmail, content);
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
}

module.exports = SendGridEmail;
