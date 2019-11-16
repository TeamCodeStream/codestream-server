// provides a class to handle rendering a single post as HTML for email notifications

'use strict';

const EmailUtilities = require('./server_utils/email_utilities');
const Utils = require('./utils');

class ReplyRenderer {

	/* eslint complexity: 0 */
	render (options) {

		const authorDiv = this.renderAuthorDiv(options);
		const textDiv = this.renderTextDiv(options);

		return `
<div class="replyWrapper">
	${authorDiv}
	${textDiv}
</div>
`;
	}

	// render the author line
	renderAuthorDiv (options) {
		const { post, creator, timeZone } = options;
		// the timestamp is dependent on the user's timezone, but if all users are from the same
		// timezone, we can format the timestamp here and fully render the email; otherwise we
		// have to do field substitution when we send the email to each user
		const datetime = timeZone ? Utils.formatTime(post.createdAt, timeZone) : '{{{datetime}}}';

		const author = creator ? (creator.username || EmailUtilities.parseEmail(creator.email).name) : '';
		return `
<div class="authorLine">
	<span class="author">${author}</span>&nbsp;<span class="datetime">${datetime}</span>
</div>
`;
	}

	// render the div for the post text
	renderTextDiv (options) {
		const { post, mentionedUserIds, members } = options;
		const text = Utils.prepareForEmail(post.text, mentionedUserIds, members);
		return `
<div class="title">
	${text}
	<br>
</div>
`;
	}
}

module.exports = ReplyRenderer;
