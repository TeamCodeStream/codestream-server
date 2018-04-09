// provides a class to handle rendering a single post as HTML for email notifications

'use strict';

const EmailUtilities = require(process.env.CS_API_TOP + '/server_utils/email_utilities');
const HtmlEscape = require(process.env.CS_API_TOP + '/server_utils/html_escape');
const MomentTimezone = require('moment-timezone');

class PostRenderer {

	render (options) {
		const { post, sameAuthor, timeZone } = options;

		// the timestamp is dependent on the user's timezone, but if all users are from the same
		// timezone, we can format the timestamp here and fully render the email; otherwise we
		// have to do field substitution when we send the email to each user
		const datetime = timeZone ? PostRenderer.formatTime(post.get('createdAt'), timeZone) : '{{{datetime}}}';

		const replyText = this.getReplyText(options);
		const text = this.getNotificationText(options);
		const codeBlock = this.getNotificationCodeBlock(options);
		const code = this.cleanForEmail((codeBlock && codeBlock.code) || '');
		const preContext = this.cleanForEmail((codeBlock && codeBlock.preContext) || '');
		const postContext = this.cleanForEmail((codeBlock && codeBlock.postContext) || '');

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
	reply to ${replyText}
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
		<div class="codeContext">
			${preContext}
		</div>
		<div class="code">
			${code}
		</div>
		<div class="codeContext">
			${postContext}
		</div>
	</div>
</div>
`;
		}

		return `
<div class="authorLine">
	${authorSpan}<span class="datetime">${datetime}</span>
 </div>
 ${replyToDiv}
 ${codeBlockDiv}
<div class="text">
	${text}
</div>
<hr class=rule>
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
		return this.cleanForEmail(post.get('text') || '');
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

	// clean this text for email
	cleanForEmail (text) {
		return HtmlEscape.escapeHtml(text)
			.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
			.replace(/^ +/gm, match => { return match.replace(/ /g, '&nbsp;'); })
			.replace(/\n/g, '<br/>');
	}

	// render the author span portion of an email post
	static renderAuthorSpan (creator) {
		const author = creator.get('username') || EmailUtilities.parseEmail(creator.get('email')).name;
		return `<span class="author">${author}&nbsp;&middot;&nbsp;</span>`;
	}

	// format date/time display for email render, taking into account the given time zone
	static formatTime (timeStamp, timeZone) {
		timeZone = timeZone || 'America/New_York';
		return MomentTimezone.tz(timeStamp, timeZone).format('ddd, MMM D h:mm a');
	}
}

module.exports = PostRenderer;
