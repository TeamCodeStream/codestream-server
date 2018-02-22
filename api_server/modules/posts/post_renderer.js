// provides a class to handle rendering a single post as HTML for email notifications

'use strict';

const EmailUtilities = require(process.env.CS_API_TOP + '/server_utils/email_utilities');
const HtmlEscape = require(process.env.CS_API_TOP + '/server_utils/html_escape');

class PostRenderer {

	render (options, callback) {
		const { creator, sameAuthor/*, timeZone*/ } = options;
		const author = creator.get('username') || EmailUtilities.parseEmail(creator.get('email')).name;
		const displayAuthor = sameAuthor ? 'display:none' : '{{{displayAuthor}}}';
//		const datetime = new Date(post.get('createdAt')).toString();
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
	<span class="author" style=${displayAuthor}>${author}&nbsp;</span><span class="datetime">{{{datetime}}}</span>
 </div>
 <div class="replyto" style="${displayReplyTo}">
 	<span class="replyToText">reply to </span>${replyText}
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
}

module.exports = PostRenderer;
