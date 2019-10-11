// provides a class to handle rendering a single post as HTML for email notifications

'use strict';

const EmailUtilities = require('./server_utils/email_utilities');
const HtmlEscape = require('./server_utils/html_escape');
const MomentTimezone = require('moment-timezone');
const Path = require('path');
const HLJS = require('highlight.js');

class PostRenderer {

	/* eslint complexity: 0 */
	render (options) {
		const { post, suppressAuthors, timeZone, fileStreams, codemarks, markers } = options;

		// the timestamp is dependent on the user's timezone, but if all users are from the same
		// timezone, we can format the timestamp here and fully render the email; otherwise we
		// have to do field substitution when we send the email to each user
		const datetime = timeZone ? PostRenderer.formatTime(post.createdAt, timeZone) : '{{{datetime}}}';

		const replyText = this.getReplyText(options);
		const text = this.getNotificationText(options);
		const codemark = post.codemarkId ? 
			codemarks.find(codemark => codemark.id === post.codemarkId) :
			null;

		// we don't display the author if all the emails are from the same author, but this can
		// be user-dependent, so if we know all the posts are from the same author, we can hide
		// the author, otherwise, we have to do field substitution when we send the email to each user
		let authorSpan = '';
		if (!suppressAuthors) {
			authorSpan = '{{{authorSpan}}}';
		}

		// only display "reply to" if the post is a reply
		let replyToDiv = '';
		if (replyText) {
			replyToDiv = `
<div class="replyto">
	reply to &quot;${replyText}&quot;
	<br>
</div>
`;
		}

		// display title for certain codemark types
		let titleDiv = '';
		if (codemark && codemark.title) {
			const titleClass = text ? 'titleWithText' : 'title';
			titleDiv = `
<div class="${titleClass}">
	${codemark.title}
	<br>
</div>
`;
		}

		// possibly display code blocks
		const codeBlockDivs = ((codemark && codemark.markerIds) || []).map(markerId => {
			return this.renderMarker(markerId, markers, fileStreams);
		}).join('');

		// don't display text if this is an "emote" (starting with /me)
		let textDiv = '';
		if (text && !post.hasEmote) {
			textDiv =	`
<div class="text">
	${text}
</div>
`;
		}

		// display assignees if this is an issue with assignees
		let assigneesDiv = '';
		if (
			codemark && 
			codemark.type === 'issue' && 
			(
				(codemark.assignees && codemark.assignees.length > 0) ||
				(codemark.externalAssignees && codemark.externalAssignees.length > 0)
			)
		) {
			const assigneesText = this.getAssigneesText(codemark, options);
			assigneesDiv = `
<div class="assigneesTitle">
	Assignees
</div>
<div class="assignees">
	${assigneesText}
</div>
`;
		}
		return `
<div class="postWrapper">
	<div class="authorLine">
		${authorSpan}<span class="datetime">${datetime}</span>
	</div>
	${replyToDiv}
	${titleDiv}
	${textDiv}
	${assigneesDiv}
	${codeBlockDivs}
</div>
`;
	}

	// render a single code block
	renderMarker (markerId, markers, fileStreams) {
		const marker = markers.find(marker => marker.id === markerId);
		if (!marker || !marker.code) { return; }

		const fileStream = marker.fileStreamId && fileStreams.find(stream => stream.id === marker.fileStreamId);
		let file = (fileStream && fileStream.file) || marker.file || '';
		let code = marker.code;

		if (file) {
			// do syntax highlighting for the code, based on the file extension
			let extension = Path.extname(file).toLowerCase();
			if (extension.startsWith('.')) {
				extension = extension.substring(1);
			}
			code = this.highlightCode(code, extension);

			// try to prevent the email client from linkifying this url
			file = file
				.replace(/\//g, '<span>/</span>')
				.replace(/\./g, '<span>.</span>');
		}

		return `
<div>
	<br>
	<div class="codeBlock">
		<div class="pathToFile">
			${file}
		</div>
		<div class="code">
			${code}
		</div>
	</div>
</div>
`;
	}

	// get the text to display for the parent post, if this is a reply
	getReplyText (options) {
		const { parentPost, parentCodemark } = options;
		return parentCodemark ?
			parentCodemark.title || parentCodemark.text :
			parentPost ? parentPost.text : null;
	}

	// get the text of the post for the notification
	getNotificationText (options) {
		const { post, codemarks } = options;
		const codemark = post.codemarkId ? 
			codemarks.find(codemark => codemark.id === post.codemarkId) :
			null;
		let text = (codemark && codemark.text) || post.text;
		text = this.cleanForEmail(text || '');
		return this.handleMentions(text, options);
	}

	// handle mentions in the post text, for any string starting with '@', look for a matching
	// user in the list of mentioned users in the post ... if we find one, put styling on 
	// the mention
	handleMentions (text, options) {
		const { post } = options;
		let { members } = options;
		if (!members) {
			members = [];
		}
		const mentionedUserIds = post.mentionedUserIds || [];
		mentionedUserIds.forEach(userId => {
			const user = members.find(user => user.id === userId);
			if (user) {
				const username = user.username || EmailUtilities.parseEmail(user.email).name;
				const regexp = new RegExp(`@${username}`, 'g');
				text = text.replace(regexp, `<span class=mention>@${username}</span>`);
			}
		});
		return text;
	}

	// get the assignees to an issue displayed as usernames
	getAssigneesText (codemark, options) {
		let { members } = options;
		if (!members) {
			members = [];
		}
		const users = [];
		(codemark.assignees || []).forEach(userId => {
			const user = members.find(user => user.id === userId);
			if (user) {
				users.push(user.username);
			}
		});
		(codemark.externalAssignees || []).forEach(assignee => {
			if (
				typeof assignee === 'object' &&
				assignee.displayName && 
				typeof assignee.displayName === 'string'
			) {
				users.push(assignee.displayName);
			}
		});
		return users.join(', ');
	}
	
	// do syntax highlighting on a code block
	highlightCode (code, extension) {
		if (extension) {
			code = HLJS.highlight(extension, code).value;
		}
		return this.whiteSpaceToHtml(code);
	}

	// clean this text for email
	cleanForEmail (text) {
		return this.whiteSpaceToHtml(HtmlEscape.escapeHtml(text));
	}

	// convert whitespace in the passed text to html characters
	whiteSpaceToHtml (text) {
		return text
			.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
			.replace(/^ +/gm, match => { return match.replace(/ /g, '&nbsp;'); })
			.replace(/\n/g, '<br/>');
	}

	// render the author span portion of an email post
	static renderAuthorSpan (creator, codemark, emote) {
		const author = creator.username || EmailUtilities.parseEmail(creator.email).name;
		let text = `<span class="author">${author}&nbsp;</span>`;
		if (codemark) {
			const codemarkText = PostRenderer.getCodemarkActivity(codemark);
			text += `${codemarkText}&nbsp;&nbsp;`;
		}
		else if (emote) {
			text += `${emote}&nbsp;&nbsp;`;
		}
		else {
			text += '&nbsp;';
		}
		return text;
	}

	// format date/time display for email render, taking into account the given time zone
	static formatTime (timeStamp, timeZone) {
		timeZone = timeZone || 'America/New_York';
		return MomentTimezone.tz(timeStamp, timeZone).format('ddd, MMM D h:mm a');
	}
	
	// get the activity text associated with a particular codemark type
	static getCodemarkActivity (codemark) {
		switch (codemark.type) {
		case 'question': 
			return 'has a question';
		case 'issue': 
			return 'posted an issue';
		case 'bookmark': 
			return 'set a bookmark';
		case 'trap':
			return 'created a code trap';
		default:
			return 'commented on code';	// shouldn't happen, just a failsafe
		}
	}
}

module.exports = PostRenderer;
