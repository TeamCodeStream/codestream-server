// provides a class through which to send email notifications

'use strict';

class EmailNotificationV2Sender {

	// send an email notification to the user specified
	async sendEmailNotification (options, outboundEmailServerConfig) {
		const { user, creator, team, stream, replyToPostId, content, sender, category, requestId } = options;
		const inboundEmailDisabled = outboundEmailServerConfig.inboundEmailServer.inboundEmailDisabled;
		const { replyToDomain, senderEmail } = outboundEmailServerConfig.email;
		const fromName = creator ? `${sender.getUserDisplayName(creator)} (via CodeStream)` : 'CodeStream';
		const subject = this.getNotificationSubject(options);
		const replyTo = inboundEmailDisabled ? '' : `${replyToPostId}.${stream.id}.${team.id}@${replyToDomain}`;
		await sender.sendEmail({
			type: 'notification',
			from: { email: senderEmail, name: fromName },
			user,
			replyTo,
			subject,
			content,
			category,
			requestId
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
