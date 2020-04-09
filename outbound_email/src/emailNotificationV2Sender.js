// provides a class through which to send email notifications

'use strict';

class EmailNotificationV2Sender {

	// send an email notification to the user specified
	async sendEmailNotification (options, outboundEmailServerConfig) {
		const { user, creator, team, stream, replyToPostId, content, sender } = options;
		const fromName = creator ? `${sender.getUserDisplayName(creator)} (via CodeStream)` : 'CodeStream';
		const subject = this.getNotificationSubject(options);
		const replyTo = outboundEmailServerConfig.inboundEmailDisabled ? '' : `${replyToPostId}.${stream.id}.${team.id}@${outboundEmailServerConfig.replyToDomain}`;
		await sender.sendEmail({
			type: 'notification',
			from: { email: outboundEmailServerConfig.senderEmail, name: fromName },
			user,
			replyTo,
			subject,
			content
		});
	}

	// determine the subject of an email notification
	getNotificationSubject (options) {
		const { codemark, review, isReply } = options;
		const codemarkOrReview = review || codemark;
		let title = codemarkOrReview.title || codemarkOrReview.text;
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
