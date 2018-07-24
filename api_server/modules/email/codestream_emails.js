// provides a class through which to send particular email types

'use strict';

const SendGridEmail = require('./sendgrid_email');
const EmailUtilities = require(process.env.CS_API_TOP + '/server_utils/email_utilities');

class CodeStreamEmails {

	constructor (options) {
		Object.assign(this, options);
		this.sendgridEmail = new SendGridEmail(this.sendgrid);
	}

	// send a confirmation email to the user specified, with a link rather than a confirmation code
	async sendConfirmationEmailWithLink (options) {
		const { user, request, url } = options;
		const email = user.get('email');
		if (request) {
			request.log(`Sending confirmation email with link to ${email}`);
		}
		const name = this.getUserDisplayName(user);	// glean a user name from attributes defined for the user

		// let SendGrid handle sending the email, they have a confirmation email template
		await this.sendgridEmail.sendEmail(
			{
				from: { email: this.supportEmail, name: 'CodeStream' },
				to: { email: user.get('email'), name: name },
				templateId: this.confirmationLinkEmailTemplateId,
				request: request,
				testCallback: this.testCallback,
				user: user,
				fields: { url }
			}
		);
	}

	// send a confirmation email to the user specified, for backward compatibility, but to be 
	// deprecated once sign-up is fully moved out of the IDE
	async sendConfirmationEmail (options) {
		const { user, request } = options;
		const email = user.get('email');
		if (request) {
			request.log(`Sending confirmation email to ${email}`);
		}
		const name = this.getUserDisplayName(user);	// glean a user name from attributes defined for the user

		// let SendGrid handle sending the email, they have a confirmation email template
		await this.sendgridEmail.sendEmail(
			{
				from: { email: this.supportEmail, name: 'CodeStream' },
				to: { email: user.get('email'), name: name },
				fields: {
					code: user.get('confirmationCode'),
					name: name
				},
				templateId: this.confirmationEmailTemplateId,
				request: request,
				testCallback: this.testCallback,
				user: user
			}
		);
	}

	// send email to a user trying to register that they are already registered
	async sendAlreadyRegisteredEmail (options) {
		const { user, request } = options;
		const email = user.get('email');
		if (request) {
			request.log(`Sending already-registered email to ${email}`);
		}
		const name = this.getUserDisplayName(user);	// glean a user name from attributes defined for the user

		// let SendGrid handle sending the email, they have a confirmation email template
		await this.sendgridEmail.sendEmail(
			{
				from: { email: this.supportEmail, name: 'CodeStream' },
				to: { email: user.get('email'), name: name },
				templateId: this.alreadyRegisteredEmailTemplateId,
				request: request,
				testCallback: this.testCallback,
				user: user
			}
		);
	}

	// send an invite email to the user specified
	async sendInviteEmail (options) {
		const { inviter, user, team, request } = options;
		const email = user.get('email');
		if (request) {
			request.log(`Sending invite email to ${email}`);
		}
		const name = this.getUserDisplayName(user);	// glean a user name from attributes defined for the user
		const inviterName = this.getUserDisplayName(inviter);
		const templateId = user.get('isRegistered') ? this.registeredUserInviteEmailTemplateId : this.newUserInviteEmailTemplateId;
		const numInvites = user.get('numInvites') || 0;
		const campaign = numInvites > 0 ? 'reinvite_email' : 'invitation_email';
		const checkOutLink = `https://get.codestream.com/invited?utm_medium=email&utm_source=product&utm_campaign=${campaign}`;

		// let SendGrid handle sending the email, they have an invite email template
		await this.sendgridEmail.sendEmail(
			{
				from: { email: this.senderEmail, name: inviterName },
				to: { email, name },
				fields: {
					teamName: team.get('name'),
					checkOutLink
				},
				templateId,
				request,
				testCallback: this.testCallback,
				user
			}
		);
	}

	// send email to a user to help them reset their password, contains a link to the web
	async sendResetPasswordEmail (options) {
		const { user, request, url } = options;
		const email = user.get('email');
		if (request) {
			request.log(`Sending reset password email to ${email}`);
		}
		const name = this.getUserDisplayName(user);	// glean a user name from attributes defined for the user

		// let SendGrid handle sending the email, they have a confirmation email template
		await this.sendgridEmail.sendEmail(
			{
				from: { email: this.supportEmail, name: 'CodeStream' },
				to: { email: user.get('email'), name: name },
				templateId: this.resetPasswordEmailTemplateId,
				request: request,
				testCallback: this.testCallback,
				user: user,
				fields: { url }
			}
		);
	}
	
	// send an email notification to the user specified
	async sendEmailNotification (options) {
		const { user, creator, posts, team, stream, content, request, mentioningAuthor } = options;
		const email = user.get('email');
		const author = mentioningAuthor || creator;
		const fromName = author ? `${this.getUserDisplayName(author)} (via CodeStream)` : 'CodeStream';
		const userName = this.getUserDisplayName(user);
		if (request) {
			request.log(`Sending email notification to ${email}, posts from ${posts[0].id} to ${posts[posts.length-1].id}`);
		}
		const subject = this.getNotificationSubject(options);
		const replyTo = `${stream.id}.${team.id}@${this.replyToDomain}`;

		// let SendGrid handle sending the email, they have an email notification template
		await this.sendgridEmail.sendEmail(
			{
				from: { email: this.senderEmail, name: fromName },
				to: { email: email, name: userName },
				replyTo: { email: replyTo, name: 'CodeStream' },
				subject,
				content,
				request,
				testCallback: this.testCallback,
				user
			}
		);
	}

	// send an email to us at team@codestream.com that a new team has been created
	sendTeamCreatedEmail (options) {
		const userName = this.getUserDisplayName(options.user);
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
		const { stream, mentioningAuthor } = options;
		const type = stream.get('type');
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
			return `New messages for ${team.get('name')}`;
		}
	}

	// get the subject for a post in a channel stream
	getNotificationSubjectForChannelStream (options) {
		const { stream, mentioningAuthor } = options;
		if (mentioningAuthor) {
			return `You were mentioned in ${stream.get('name')}`;
		}
		else {
			return `New messages in ${stream.get('name')}`;
		}
	}

	// get the subject for a post in a direct stream
	getNotificationSubjectForDirectStream (options) {
		const { mentioningAuthor, stream } = options;
		const oneOnOne = stream.get('memberIds').length === 2;
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

	// get the file for the most recent code block in the list of posts
	getFileForCodeBlock (options) {
		const { posts, markers, streams, repos, user } = options;
		// posts are ordered earliest to latest
		let numPosts = posts.length;
		for (let i = numPosts - 1; i >= 0; i--) {
			const post = posts[i];
			if (
				post.mentionsUser(user) &&
				post.get('codeBlocks') instanceof Array &&
				post.get('codeBlocks').length > 0
			) {
				const markerId = post.get('codeBlocks')[0].markerId;
				const marker = markers.find(marker => marker.id === markerId);
				const stream = streams.find(stream => marker && stream.id === marker.get('streamId'));
				const repo = repos.find(repo => stream && repo.id === stream.get('repoId'));
				if (repo) {
					const path = this.truncatePath(`${repo.get('normalizedUrl')}/${stream.get('file')}`);
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

	// given a user, figure out a full display name to use in the subject
	getUserDisplayName (user) {
		return user.get('fullName') || user.get('email');
	}

	// given a user, figure out a username to use in the subject
	getUsername (user) {
		if (user.get('username')) {
			return user.get('username');
		}
		const parsed = EmailUtilities.parseEmail(user.get('email'));
		if (typeof parsed === 'object') {
			return parsed.name;
		}
		else {
			return user.get('email');
		}
	}
}

module.exports = CodeStreamEmails;
