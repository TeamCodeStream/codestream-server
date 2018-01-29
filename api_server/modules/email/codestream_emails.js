// provides a class through which to send particular email types

'use strict';

var SendGridEmail = require('./sendgrid_email');
var EmailUtils = require('./utils');
var EmailUtilities = require(process.env.CS_API_TOP + '/server_utils/email_utilities');
var Path = require('path');
var HtmlEscape = require(process.env.CS_API_TOP + '/server_utils/html_escape');

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
		const { user, creator, post, team, repo, stream, request } = options;
		const email = user.get('email');
		const authorName = EmailUtils.getUserName(creator);
		const userName = EmailUtils.getUserName(user);
		if (request) {
			request.log(`Sending email notification to ${email}, post ${post.id}`);
		}
		const subject = this.getNotificationSubject(options);
		const author = creator.get('username') || EmailUtilities.parseEmail(creator.get('email')).name;
		const replyText = this.getReplyText(options);
		const displayReplyTo = replyText ? null : 'display:none';
		const text = this.getNotificationText(options);
		const codeBlock = this.getNotificationCodeBlock(options);
		const displayCodeBlock = codeBlock ? null : 'display:none';
		const code = this.cleanForEmail((codeBlock && codeBlock.code) || '');
		const preContext = this.cleanForEmail((codeBlock && codeBlock.preContext) || '');
		const postContext = this.cleanForEmail((codeBlock && codeBlock.postContext) || '');
		const pathToFile = 'https://' + Path.join(repo.get('normalizedUrl'), stream.get('file'));
		const intro = this.getNotificationIntro(options);
		const replyTo = `${stream.id}.${team.id}@${this.replyToDomain}`;
		const fields = {
			subject,
			author,
			replyText,
			displayReplyTo,
			text,
			preContext,
			displayCodeBlock,
			code,
			postContext,
			pathToFile,
			intro
		};

		// let SendGrid handle sending the email, they have an email notification template
		this.sendgridEmail.sendEmail(
			{
				from: { email: this.senderEmail, name: `${authorName} (via CodeStream)` },
				to: { email: email, name: userName },
				replyTo: { email: replyTo, name: 'CodeStream' },
				subject: subject,
				fields: fields,
				templateId: this.notificationEmailTemplateid,
				request: request,
				testCallback: this.testCallback,
				user: user
			},
			callback
		);
	}

	// determine the subject of an email notification
	getNotificationSubject (options) {
		let { user, post, stream } = options;
		let filename = stream.get('file');
		if (post.mentionsUser(user)) {
			return `You've been mentioned in ${filename}`;
		}
		else {
			return filename;
		}
	}

	// get the text to display for the parent post, if this is a reply
	getReplyText (options) {
		let { parentPost } = options;
		return parentPost ? parentPost.get('text') : null;
	}

	// get the text of the post for the notification
	getNotificationText (options) {
		return this.cleanForEmail(options.post.get('text') || '');
	}

	// get any code block associated iwth the post
	getNotificationCodeBlock (options) {
		let { post } = options;
		let codeBlocks = post.get('codeBlocks');
		if (!codeBlocks || codeBlocks.length === 0) {
			return null;
		}
		return codeBlocks[0];
	}

	// link that user should click on to learn about CodeStream and install the plugin
	getInstallLink (options) {
		let { user, firstEmail, post } = options;
		let mentioned = post.mentionsUser(user);
		let campaign = (
		 	(firstEmail && mentioned && 'first_mention_notification_unreg') ||
			(firstEmail && !mentioned && 'first_newmessage_notification_unreg') ||
			(!firstEmail && mentioned && 'mention_notification_unreg') ||
			(!firstEmail && !mentioned && 'newmessage_notification_unreg')
		);
		return `http://codestream.com?utm_medium=email&utm_source=product&utm_campaign=${campaign}`;
	}

	// determine the intro text of an email notification
	getNotificationIntro (options) {
		let { firstEmail, user, team, offlineForRepo } = options;
		let isRegistered = user.get('isRegistered');
		let teamName = team.get('name');
		let installLink = this.getInstallLink(options);
		if (isRegistered) {
			if (offlineForRepo) {
				return `We noticed that you don’t currently have this repo open in your IDE and didn’t want you to miss this discussion. Add to the discussion by replying to this email.`;
			}
			else {
				return `We noticed that you don’t currently have your IDE open and didn’t want you to miss this discussion. Add to the discussion by replying to this email.`;
			}
		}
		else if (firstEmail) {
			return `You’ve been added to ${teamName} on CodeStream, where your team is currently discussing code. Add to the discussion by replying to this email. <a clicktracking="off" href="${installLink}">Install CodeStream</a> to chat right from within your IDE.`;
		}
		else {
			return `Add to the discussion by replying to this email. <a clicktracking="off" href="${installLink}">Install CodeStream</a> to chat right from within your IDE.`;
		}
	}

	// clean this text for email 
	cleanForEmail (text) {
		return HtmlEscape.escapeHtml(text)
			.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
			.replace(/^ +/gm, match => { return match.replace(/ /g, '&nbsp;'); })
			.replace(/\n/g, '<br/>');
	}
}

module.exports = CodeStreamEmails;
