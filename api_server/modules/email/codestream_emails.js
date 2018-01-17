// provides a class through which to send particular email types

'use strict';

var SendGridEmail = require('./sendgrid_email');
var EmailUtils = require('./utils');
var Path = require('path');

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
		let { user, creator, post, team, repo, stream, request } = options;
		let email = user.get('email');
		let authorName = EmailUtils.getUserName(creator);
		let userName = EmailUtils.getUserName(user);
		if (request) {
			request.log(`Sending email notification to ${email}, post ${post.id}`);
		}
		const subject = this.getNotificationSubject(options);
		const intro = this.getNotificationIntro(options);
		const repoUrl = 'https://' + repo.get('normalizedUrl');
		const replyText = this.getReplyText(options);
		const displayReplyTo = replyText ? null : 'display:none';
		const text = this.getNotificationText(options);
		const codeBlock = this.getNotificationCodeBlock(options);
		const displayCodeBlock = codeBlock ? null : 'display:none';
		const code = (codeBlock && codeBlock.code) || '';
		const preContext = (codeBlock && codeBlock.preContext) || '';
		const postContext = (codeBlock && codeBlock.postContext) || '';
		const installText = this.getInstallText(options);
		const displayInstallText = installText ? null : 'display:none';
		const replyTo = `${stream.id}.${team.id}@${this.replyToDomain}`;
		const fields = {
			intro,
			repoUrl,
			replyText,
			displayReplyTo,
			text,
			code,
			preContext,
			postContext,
			subject,
			installText,
			displayCodeBlock,
			displayInstallText
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
		let { user, post, firstEmail, creator, stream } = options;
		let authorFirstName = creator.get('firstName') || creator.get('email');
		let filename = Path.basename(stream.get('file'));
		if (post.mentionsUser(user)) {
			if (firstEmail) {
				return `${authorFirstName} mentioned you in a discussion about ${filename}`;
			}
			else {
				return `You've been mentioned in a discussion about ${filename}`;
			}
		}
		else {
			if (firstEmail) {
				return `${authorFirstName} is discussing ${filename}`;
			}
			else {
				return `New message about ${filename}`;
			}
		}
	}

	// determine the intro text of an email notification
	getNotificationIntro (options) {
		let { firstEmail, user, team, creator, stream, offlineForRepo } = options;
		let isRegistered = user.get('isRegistered');
		let teamName = team.get('name');
		let authorName = EmailUtils.getUserName(creator);
		let authorFirstName = creator.get('firstName') || creator.get('email');
		let filename = Path.basename(stream.get('file'));
		let installLink = this.getInstallLink(options);
		if (isRegistered) {
			if (offlineForRepo) {
				return `We noticed that you don’t currently have the following repository open in your IDE and didn’t want you to miss this message from ${authorFirstName} about <b>${filename}</b>.`;
			}
			else {
				return `We noticed that you don’t currently have your IDE open and didn’t want you to miss this message from ${authorFirstName} about <b>${filename}</b>.`;
			}
		}
		else if (firstEmail) {
			return `You’ve been added to ${teamName} on CodeStream, where ${authorName} has started a discussion about <b>${filename}</b>. We’ll send you an email when the other developers on your team ask and answer questions about code, and you can participate in the discussion by simply replying to the email. Or, <a clicktracking="off" href="${installLink}">learn more about CodeStream</a> and install the plugin so that you can chat right from within your IDE!`;
		}
		else {
			return `${authorName} has posted a new message about <b>${filename}</b>.`;
		}
	}

	// get the text to display for the parent post, if this is a reply
	getReplyText (options) {
		let { parentPost } = options;
		return parentPost ? parentPost.get('text') : null;
	}

	// get the text of the post for the notification
	getNotificationText (options) {
		return options.post.get('text');
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

	// whether we display the link to install the plugin below the post
	getInstallText (options) {
		let { firstEmail, user } = options;
		if (!firstEmail && !user.get('isRegistered')) {
			let installLink = this.getInstallLink(options);
			return `<a clicktracking=off href="${installLink}">Install the CodeStream plugin</a> and move the conversation out of your Inbox, and into your IDE.`;
		}
	}

	// link that user should click on to learn about CodeStream and install the plugin
	getInstallLink (options) {
		let { user, firstEmail, post } = options;
		let email = user.get('email');
		let mentioned = post.mentionsUser(user);
		let campaign = (
		 	(firstEmail && mentioned && 'first_mention_notification_unreg') ||
			(firstEmail && !mentioned && 'first_newmessage_notification_unreg') ||
			(!firstEmail && mentioned && 'mention_notification_unreg') ||
			(!firstEmail && !mentioned && 'newmessage_notification_unreg')
		);
		return `http://codestream.com?utm_medium=${email}&utm_source=product&utm_campaign=${campaign}`;
	}
}

module.exports = CodeStreamEmails;
