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

	sendEmail (options, callback) {
		let request = this.createMailRequest(options);
		if (!this.emailTo) {
			if (options.request) {
				options.request.log(`Would have sent to ${options.to}: ${options.subject}`);
			}
			return process.nextTick(callback);
		}
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

	createMailRequest (options) {
		let mail = this.createMailObject(options);
		return this.sendgrid.emptyRequest({
			method: 'POST',
			path: this.url,
			body: mail.toJSON(),
		});
	}

	createMailObject (options) {
		let helper = SendGrid.mail;
		let fromEmail = new helper.Email(options.from);
		let subject = options.subject || '';
		let to = options.to;
		if (this.emailTo && this.emailTo !== 'on') {
			subject = `{{{${to}}}} ${subject}`;
			to = this.emailTo;
			if (options.request) {
				options.request.log(`Diverting to ${to}`);
			}
		}
		let toEmail = new helper.Email(to);
		let content = new helper.Content('text/html', options.content || '<html></html>');
		let mail = new helper.Mail(fromEmail, subject || '', toEmail, content);
		Object.keys(options.fields || {}).map(field => {
			mail.personalizations[0].addSubstitution(
				new helper.Substitution(
			  		'{{' + field + '}}',
			 		options.fields[field]
				)
			);
		});
		mail.setTemplateId(options.templateId);
		return mail;
	}
}

module.exports = SendGridEmail;
