// provides a class through which to send email notifications

'use strict';

const EmailUtilities = require('./server_utils/email_utilities');

class EmailNotificationSender {

	// send an email notification to the user specified
	async sendEmailNotification (options, outboundEmailServerConfig) {
		const { user, creator, team, stream, content, mentioningAuthor, sender } = options;
		const author = mentioningAuthor || creator;
		const fromName = author ? `${sender.getUserDisplayName(author)} (via CodeStream)` : 'CodeStream';
		const subject = this.getNotificationSubject(options);
		const replyTo = outboundEmailServerConfig.inboundEmailDisabled ? '' : `${stream.id}.${team.id}@${outboundEmailServerConfig.replyToDomain}`;
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
		const { stream, mentioningAuthor } = options;
		const type = stream.type;
		switch (type) {
		case 'file':
			return this.getNotificationSubjectForFileStream(options);
		case 'channel':
			return this.getNotificationSubjectForChannelStream(options);
		case 'direct':
			return this.getNotificationSubjectForDirectStream(options);
		default:
			// total fallback
			if (mentioningAuthor) {
				return 'You were mentioned on CodeStream';
			}
			else {
				return 'New message from CodeStream';
			}
		}
	}

	// get the subject for a post in a file-stream ... we're not really using these at this time,
	// so this is a total fallback, just in case
	getNotificationSubjectForFileStream (options) {
		const { mentioningAuthor, team } = options;
		if (mentioningAuthor) {
			return 'You\'ve been mentioned on CodeStream';
		}
		else {
			return `New messages for ${team.name}`;
		}
	}

	// get the subject for a post in a channel stream
	getNotificationSubjectForChannelStream (options) {
		const { stream, mentioningAuthor } = options;
		if (mentioningAuthor) {
			return `You were mentioned in ${stream.name}`;
		}
		else {
			return `New messages in ${stream.name}`;
		}
	}

	// get the subject for a post in a direct stream
	getNotificationSubjectForDirectStream (options) {
		const { mentioningAuthor, stream } = options;
		const oneOnOne = stream.memberIds.length === 2;
		if (oneOnOne) {
			if (mentioningAuthor) {
				const authorName = this.getUsername(mentioningAuthor);
				return `You were mentioned by ${authorName}`;
			}
			else {
				const streamName = this.getStreamName(options);
				if (!streamName) {
					return 'New messages from CodeStream';
				}
				else {
					return `New messages from ${streamName}`;
				}
			}
		}
		else if (mentioningAuthor) {
			const streamName = this.getStreamName(options);
			if (!streamName) {
				return 'You were mentioned in a post from CodeStream';
			}
			else {
				return `You were mentioned in a post for ${streamName}`;
			}
		}
		else {
			const streamName = this.getStreamName(options, true);
			if (!streamName) {
				return 'New messages from CodeStream';
			}
			else {
				return `New messages in a post for ${streamName}`;
			}
		}
	}

	// get the name of a direct stream, based on membership and current user
	getStreamName (options, includeYou) {
		const { user, members } = options;
		let { postCreators } = options;

		// in naming the stream, we prioritize active participants in the conversation
		// (i.e., authors of posts the user will be seeing in the email)
		postCreators = postCreators.filter(postCreator => postCreator.id !== user.id);
		const nonPostCreators = members.filter(member => {
			return (
				member.id !== user.id &&
				!postCreators.find(postCreator => postCreator.id === member.id)
			);
		});
		const streamMembers = [...postCreators, ...nonPostCreators];
		if (streamMembers.length === 0) {
			return null; // shouldn't really happen
		}
		const usernames = streamMembers.map(member => {
			return this.getUsername(member);
		});
		if (includeYou) {
			usernames.unshift('you');
		}
		if (usernames.length === 1) {
			return usernames[0];
		}
		else if (usernames.length === 2) {
			return usernames.join(' and ');
		}
		else if (usernames.length === 3) {
			return `${usernames[0]}, ${usernames[1]} and ${usernames[2]}`;
		}
		else {
			return `${usernames[0]}, ${usernames[1]} and others`;
		}
	}

	// given a user, figure out a username to use in the subject
	getUsername (user) {
		if (user.username) {
			return user.username;
		}
		const parsed = EmailUtilities.parseEmail(user.email);
		if (typeof parsed === 'object') {
			return parsed.name;
		}
		else {
			return user.email;
		}
	}
}

module.exports = EmailNotificationSender;
