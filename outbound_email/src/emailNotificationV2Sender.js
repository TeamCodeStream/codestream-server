// provides a class through which to send email notifications

'use strict';

const Config = require('./config');

class EmailNotificationV2Sender {

	// send an email notification to the user specified
	async sendEmailNotification (options) {
		const { user, creator, team, stream, codemark, content, sender } = options;
		const fromName = creator ? `${sender.getUserDisplayName(creator)} (via CodeStream)` : 'CodeStream';
		const subject = this.getNotificationSubject(options);
		const replyTo = Config.inboundEmailDisabled ? '' : `${codemark.id}.${stream.id}.${team.id}@${Config.replyToDomain}`;
		await sender.sendEmail({
			type: 'notification',
			from: { email: Config.senderEmail, name: fromName },
			user,
			replyTo,
			subject,
			content
		});
	}

	// determine the subject of an email notification
	getNotificationSubject (options) {
		const { codemark, isReply } = options;
		let title = codemark.title || codemark.text;
		if (title.length >= 80) {
			title = title.substring(0, 80) + '...';
		}
		if (isReply) {
			title = 're: ' + title;
		}
		return title;
	}
}

module.exports = EmailNotificationV2Sender;
