// provides a class through which to send particular email types

'use strict';

var SendGridEmail = require('./sendgrid_email');
var EmailUtils = require('./utils');

class CodeStreamEmails {

	constructor (options) {
		Object.assign(this, options);
		this.sendgridEmail = new SendGridEmail(this.sendgrid);
	}

	// send a confirmation email to the user specified
	sendConfirmationEmail (options, callback) {
		let { user, request } = options;
		let email = user.get('email');
		if (request) {
			request.log(`Sending confirmation email to ${email}`);
		}
		const name = EmailUtils.getUserName(user);	// glean a user name from attributes defined for the user

		// let SendGrid handle sending the email, they have a confirmation email template
		this.sendgridEmail.sendEmail(
			{
				from: { email: this.senderEmail, name: 'CodeStream' },
				to: { email: user.get('email'), name: name },
				fields: {
					code: user.get('confirmationCode'),
					name: name
				},
				templateId: this.confirmationEmailTemplateId,
				request: request,
				testCallback: this.testCallback,
				user: user
			},
			callback
		);
	}

	// send an email notification to the user specified
	sendEmailNotification (options, callback) {
		const { user, creator, posts, team, stream, content, request, sameAuthor } = options;
		const email = user.get('email');
		let fromName;
		if (sameAuthor) {
			const authorName = EmailUtils.getUserName(creator);
			fromName = `${authorName} (via CodeStream)`;
		}
		else {
			fromName = 'CodeStream';
		}
		const userName = EmailUtils.getUserName(user);
		if (request) {
			request.log(`Sending email notification to ${email}, posts from ${posts[0].id} to ${posts[posts.length-1].id}`);
		}
		const subject = this.getNotificationSubject(options);
		const replyTo = `${stream.id}.${team.id}@${this.replyToDomain}`;

		// let SendGrid handle sending the email, they have an email notification template
		this.sendgridEmail.sendEmail(
			{
				from: { email: this.senderEmail, name: fromName },
				to: { email: email, name: userName },
				replyTo: { email: replyTo, name: 'CodeStream' },
				subject,
				content,
				request,
				testCallback: this.testCallback,
				user
			},
			callback
		);
	}

	// send an email to us at team@codestream.com that a new team has been created
	sendTeamCreatedEmail (options) {
		const userName = EmailUtils.getUserName(options.user);
		this.sendgridEmail.sendEmail(
			{
				from: { email: this.senderEmail, name: 'CodeStream' },
				to: 'team@codestream.com',
				subject: `Team ${options.team.get('name')} is now on CodeStream!`,
				content: `Created by ${userName}`,
				request: options.request
			},
			() => { }
		);
	}

	// determine the subject of an email notification
	getNotificationSubject (options) {
		const { stream, mentioned } = options;
		const filename = stream.get('file');
		if (mentioned) {
			return `You've been mentioned in ${filename}`;
		}
		else {
			return filename;
		}
	}
}

module.exports = CodeStreamEmails;
