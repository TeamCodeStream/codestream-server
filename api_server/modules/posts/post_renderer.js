// provides a class to handle rendering a single post as HTML for email notifications

'use strict';

const EmailUtilities = require(process.env.CS_API_TOP + '/server_utils/email_utilities');
const HtmlEscape = require(process.env.CS_API_TOP + '/server_utils/html_escape');
const MomentTimezone = require('moment-timezone');
const Path = require('path');
const HLJS = require('highlight.js');

class PostRenderer {

	render (options) {
		const { post, sameAuthor, timeZone, streams, markers } = options;

		// the timestamp is dependent on the user's timezone, but if all users are from the same
		// timezone, we can format the timestamp here and fully render the email; otherwise we
		// have to do field substitution when we send the email to each user
		const datetime = timeZone ? PostRenderer.formatTime(post.get('createdAt'), timeZone) : '{{{datetime}}}';

		const replyText = this.getReplyText(options);
		const text = this.getNotificationText(options);
		const codeBlock = this.getNotificationCodeBlock(options);
		let pathToFile = '';
		let code = ''; 
		let preContext = '';
		let postContext = '';
		if (codeBlock && codeBlock.code) {
			const marker = markers.find(marker => marker.id === codeBlock.markerId);
			const stream = streams.find(stream => marker && stream.id === marker.get('streamId'));
			// try to prevent the email client from linkifying this url
			let path = stream.get('file');
			//				let path = Path.join(repo.get('normalizedUrl'), stream.get('file'));
			pathToFile = path
				.replace(/\//g, '<span>/</span>')
				.replace(/\./g, '<span>.</span>');

			// do syntax highlighting for the code block, based on the file extension
			let extension = Path.extname(path).toLowerCase();
			if (extension.startsWith('.')) {
				extension = extension.substring(1);
			}
			code = this.highlightCode(codeBlock.code, extension);
			if (codeBlock.preContext) {
				preContext = this.highlightCode(codeBlock.preContext, extension);
			}
			if (codeBlock.postContext) {
				postContext = this.highlightCode(codeBlock.postContext, extension);
			}
		}

		// we don't display the author if all the emails are from the same author, but this can
		// be user-dependent, so if we know all the posts are from the same author, we can hide
		// the author, otherwise, we have to do field substitution when we send the email to each user
		let authorSpan = '';
		if (!sameAuthor) {
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

		// possibly display code blocks
		let codeBlockDiv = '';
		if (codeBlock) {
			codeBlockDiv = `
<div>
	<br>
	<div class="codeBlock">
		<div class="pathToFile">
			${pathToFile}
		</div>
<!--
		<div class="codeContext">
			${preContext}
		</div>
-->
		<div class="code">
			${code}
		</div>
<!--
		<div class="codeContext">
			${postContext}
		</div>
-->
		</div>
</div>
`;
		}

		return `
<div class="postWrapper">
	<div class="authorLine">
		${authorSpan}<span class="datetime">${datetime}</span>
	</div>
	${replyToDiv}
	<div class="text">
 		${text}
	</div>
	${codeBlockDiv}
</div>
`;
	}

	// get the text to display for the parent post, if this is a reply
	getReplyText (options) {
		const { parentPost } = options;
		return parentPost ? parentPost.get('text') : null;
	}

	// get the text of the post for the notification
	getNotificationText (options) {
		const { post } = options;
		let text = this.cleanForEmail(post.get('text') || '');
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
		const mentionedUserIds = post.get('mentionedUserIds') || [];
		mentionedUserIds.forEach(userId => {
			const user = members.find(user => user.id === userId);
			if (user) {
				const username = user.get('username') || EmailUtilities.parseEmail(user.get('email')).name;
				const regexp = new RegExp(`@${username}`, 'g');
				text = text.replace(regexp, `<span class=mention>@${username}</span>`);
			}
		});
		return text;
	}

	// get any code block associated iwth the post
	getNotificationCodeBlock (options) {
		const { post } = options;
		const codeBlocks = post.get('codeBlocks');
		if (!codeBlocks || codeBlocks.length === 0) {
			return null;
		}
		return codeBlocks[0];
	}

	// do syntax highlighting on a code block
	highlightCode (code, extension) {
		return this.whiteSpaceToHtml(HLJS.highlight(extension, code).value);
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
	static renderAuthorSpan (creator) {
		const author = creator.get('username') || EmailUtilities.parseEmail(creator.get('email')).name;
		return `<span class="author">${author}&nbsp;</span>`;
	}

	// format date/time display for email render, taking into account the given time zone
	static formatTime (timeStamp, timeZone) {
		timeZone = timeZone || 'America/New_York';
		return MomentTimezone.tz(timeStamp, timeZone).format('ddd, MMM D h:mm a');
	}
}

module.exports = PostRenderer;
