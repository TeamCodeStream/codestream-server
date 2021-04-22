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
		const { codemark, review, isReply, isReminder, creator, sender, user, isReplyToCodeAuthor } = options;
		const codemarkOrReview = review || codemark;
		let subject;
		if (isReminder) {
			const fromName = creator ? sender.getUserDisplayName(creator, true) : 'The author of this feedback request'; // total fallback here
			subject = `${fromName} is waiting for your feedback`;
		} else if (!user.isRegistered && review && !isReply) {
			const fromName = creator ? sender.getUserDisplayName(creator, true) : 'The author of this feedback request'; // total fallback here
			subject = `${fromName} is requesting a code review`;
		} else if (!user.isRegistered && isReplyToCodeAuthor) {
			const fromName = creator ? sender.getUserDisplayName(creator, true) : 'The author of this feedback request'; // total fallback here
			subject = `${fromName} commented on your changes`;
		} else {	
			subject = codemarkOrReview.title || codemarkOrReview.text;
			if (subject.length >= 80) {
				subject = subject.substring(0, 80) + '...';
			}
		}
		if (isReply && !isReplyToCodeAuthor) {
			subject = 're: ' + subject;
		}
		return subject;
	}
}

module.exports = EmailNotificationV2Sender;
