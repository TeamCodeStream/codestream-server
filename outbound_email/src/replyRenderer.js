// provides a class to handle rendering a single post as HTML for email notifications

'use strict';

const Utils = require('./utils');

class ReplyRenderer {
	/* eslint complexity: 0 */
	// renders a post reply
	render (options, preContent) {		
		let contentDiv = '';
		let newContentClasses = '';	 
		if (this.isMeMessage(options.post ? options.post.text : null)) {
			contentDiv = this.renderMeMessageText(options);
			newContentClasses = ' me-reply';
		}
		else {
			contentDiv = `${this.renderAuthorDiv(options)}${this.renderTextDiv(options)}`;
		}
		const earlierReplies = this.renderEarlierReplies(options);

		return `
${preContent}
${earlierReplies}
<div class="reply new-content${newContentClasses}">
	${contentDiv}
</div>
`;
	}

	// renders any content in the style of a reply
	renderContentAsReply (options, preContent, content) {
		const earlierReplies = this.renderEarlierReplies(options);
		return `
			${preContent || ''}
			${earlierReplies}
			<div class="reply new-content">
				${content}
			</div>
			`;	
	}

	isMeMessage (text) {
		return text && text.indexOf('/me ') === 0;
	}

	// render the author line with timestamp
	renderAuthorDiv (options) {
		const { post, creator, timeZone } = options;
		const authorOptions = {
			time: post.createdAt,
			creator,
			timeZone,
			datetimeField: 'datetime'
		};
		return Utils.renderAuthorDiv(authorOptions);
	}

	// render the div for the post text
	renderTextDiv (options) {
		const { post } = options;
		const text = Utils.prepareForEmail(post.text, options);
		return `
<div>
	<span class="ensure-white">${text}</span>
</div>
`;
	}

	renderMeMessageText (options) {
		const { post, creator, timeZone } = options;
		const meMessageOptions = {
			creator,
			timeZone,
			datetimeField: 'datetime',
			// remove the `/me ` part
			meMessage: Utils.prepareForEmail(post.text.substring(4), options),
		};
		return Utils.renderMeMessageDiv(meMessageOptions);
	}

	renderEarlierReplies (options) {
		const { parentObject} = options;		
		if (!parentObject) return '';
		const numRepliesParsed = !isNaN(parentObject.numReplies) ? 
			parseInt(parentObject.numReplies, 10) :
			0;
		if (numRepliesParsed < 2) {
			return '';
		}

		if (parentObject.permalink) {
			const url = `${parentObject.permalink}?ide=default`;
			return `<div class="replies-earlier"><a href="${url}" clicktracking="off">See earlier replies</a></div>`;
		}
		return '<div class="replies-earlier">See earlier replies</div>';
	}
}

module.exports = ReplyRenderer;
