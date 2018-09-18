// provides a class through which to send email notifications

'use strict';

const Config = require('./config');

class EmailNotificationSender {

	// send an email notification to the user specified
	async sendEmailNotification (options) {
		const { user, creator, posts, team, stream, content, mentioningAuthor, sender } = options;
		const author = mentioningAuthor || creator;
		const fromName = author ? `${sender.getUserDisplayName(author)} (via CodeStream)` : 'CodeStream';
		const subject = this.getNotificationSubject(options);
		const replyTo = `${stream._id}.${team._id}@${Config.replyToDomain}`;

		sender.sendEmail({
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
		postCreators = postCreators.filter(postCreator => postCreator._id !== user._id);
		const nonPostCreators = members.filter(member => {
			return (
				member._id !== user._id &&
				!postCreators.find(postCreator => postCreator._id === member._id)
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

	// get the file for the most recent code block in the list of posts
	getFileForCodeBlock (options) {
		const { posts, markers, streams, repos, user } = options;
		// posts are ordered earliest to latest
		let numPosts = posts.length;
		for (let i = numPosts - 1; i >= 0; i--) {
			const post = posts[i];
			if (
				this.postMentionsUser(post, user) &&
				post.codeBlocks instanceof Array &&
				post.codeBlocks.length > 0
			) {
				const markerId = post.codeBlocks[0].markerId;
				const marker = markers.find(marker => marker._id === markerId);
				const stream = streams.find(stream => marker && stream._id === marker.streamId);
				const repo = repos.find(repo => stream && repo._id === stream.repoId);
				if (repo) {
					const path = this.truncatePath(`${repo.normalizedUrl}/${stream.file}`);
					if (path.search(/^https?:/) >= 0) {
						return path;
					}
					else {
						return `https://${path}`;
					}
				}
			}
		}
	}

	// truncate a path to fewer than 60 characters, as needed
	truncatePath (path) {
		if (path.length < 20) { return path; }
		// this is not really that sophisticated, and can still result in long paths if their 
		// components are long, but we're not really caring too much
		const parts = path.split('/');
		const numParts = parts.length;
		if (numParts < 4) { 
			// total fallback
			return `${parts[0]}/.../${parts[2]}`;
		}
		else if (numParts === 4) {
			return `${parts[0]}/${parts[1]}/.../${parts[numParts - 1]}`;
		}
		else {
			return `${parts[0]}/${parts[1]}/.../${parts[numParts - 2]}/${parts[numParts - 1]}`;
		}
	}

	// does this post mention the current user?
	postMentionsUser (post, user) {
		const mentionedUserIds = post.mentionedUserIds || [];
		return mentionedUserIds.includes(user._id);
	}
}

module.exports = EmailNotificationSender;
