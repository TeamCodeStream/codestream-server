// provides a class to handle rendering a single post as HTML for email notifications

'use strict';

const EmailUtilities = require(process.env.CS_API_TOP + '/server_utils/email_utilities');
const HtmlEscape = require(process.env.CS_API_TOP + '/server_utils/html_escape');
const MomentTimezone = require('moment-timezone');

class PostRenderer {

	render (options, callback) {
		const { creator, post, sameAuthor, timeZone } = options;
		const author = creator.get('username') || EmailUtilities.parseEmail(creator.get('email')).name;

		// we don't display the author if all the emails are from the same author, but this can
		// be user-dependent, so if we know all the posts are from the same author, we can hide
		// the author, otherwise, we have to do field substitution when we send the email to each user
		const displayAuthor = sameAuthor ? 'display:none' : '{{{displayAuthor}}}';

		// the timestamp is dependent on the user's timezone, but if all users are from the same
		// timezone, we can format the timestamp here and fully render the email; otherwise we
		// have to do field substitution when we send the email to each user
		const datetime = timeZone ? PostRenderer.formatTime(post.get('createdAt'), timeZone) : '{{{datetime}}}';

		const replyText = this.getReplyText(options);
		const displayReplyTo = replyText ? null : 'display:none';
		const text = this.getNotificationText(options);
		const codeBlock = this.getNotificationCodeBlock(options);
		const displayCodeBlock = codeBlock ? null : 'display:none';
		const code = this.cleanForEmail((codeBlock && codeBlock.code) || '');
		const preContext = this.cleanForEmail((codeBlock && codeBlock.preContext) || '');
		const postContext = this.cleanForEmail((codeBlock && codeBlock.postContext) || '');
		return callback(`
<div class="authorLine">
	<span class="author" style=${displayAuthor}>${author}</span><span style=${displayAuthor}>&nbsp;&middot;&nbsp;</span><span class="datetime">${datetime}</span>
 </div>
 <div class="replyto" style="${displayReplyTo}">
 	reply to ${replyText}
	<br>
</div>
<div class="text">
	${text}
</div>
<div style="${displayCodeBlock}" class="codeBlock">
	<br>
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
<br>
`
		);
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
		let codeBlocks = post.get('codeBlocks');
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

	// format date/time display for email render, taking into account the given time zone
	static formatTime (timeStamp, timeZone) {
		const asString = new Date(timeStamp).toISOString();
		return MomentTimezone.tz(asString, timeZone).format('ddd, MMM d h:mm a');
	}
}

module.exports = PostRenderer;
