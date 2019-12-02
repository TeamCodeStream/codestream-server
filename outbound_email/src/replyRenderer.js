// provides a class to handle rendering a single post as HTML for email notifications

'use strict';

const EmailUtilities = require('./server_utils/email_utilities');
const Utils = require('./utils');

class ReplyRenderer {

	/* eslint complexity: 0 */
	render (options) {

		const authorDiv = this.renderAuthorDiv(options);
		const textDiv = this.renderTextDiv(options);
		const buttons = this.renderButtons(options);

		return `
<div class="codemark-wrapper">
	${authorDiv}
	${textDiv}
</div>
<div class="reply-buttons-wrapper">
	${buttons}
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
		const avatar = Utils.getAvatar(creator);
		return `
<div class="authorLine">
	<div style="max-height:0;max-width:0">
		<span class="headshot-initials">${avatar.authorInitials}</span>
	</div>
	<img class="headshot-image" src="https://www.gravatar.com/avatar/${avatar.emailHash}?s=20&d=blank" />
	<span class="author">${author}</span><span class="datetime">${datetime}</span>
</div>
	`;
	}

	// render the div for the post text
	renderTextDiv (options) {
		const { post, mentionedUserIds, members } = options;
		const text = Utils.prepareForEmail(post.text, mentionedUserIds, members);
		return `
<div class="text">
	${text}
	<br>
</div>
`;
	}

	// render buttons to display, associated with the parent codemark
	renderButtons (options) {
		const { codemark, markers } = options;
		const markerId = codemark && codemark.markerIds[0];
		const marker = markerId && markers.find(marker => marker.id === markerId);
		if (!marker) { return ''; }
		return Utils.getButtons(options, marker);
	}
}

module.exports = ReplyRenderer;
