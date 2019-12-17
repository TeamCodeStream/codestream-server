// provides a class to handle rendering a single post as HTML for email notifications

'use strict';

const Utils = require('./utils');

class EmailNotificationV2Renderer {

	// render an email notification for a codemark or reply and for a given user
	render (options) {
		const { content, unfollowLink, inboundEmailDisabled, needButtons } = options;
		let tipDiv = '';
		if (!inboundEmailDisabled) {
			tipDiv = `
<div class="ensure-white">
	Tip: post a reply to this codemark by replying to this email directly.
</div>
`;
		}

		let buttons = '';
		if (needButtons) {
			buttons = Utils.renderButtons(options);
		}

		return `
<html>
	<head>
		<link href="http://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/styles/default.min.css" rel="stylesheet" type="text/css">
		<style>
			${options.styles}
		</style>
	</head>
	<body>
		<div class="master">
			<a href="https://codestream.com">
				<img alt="CodeStream" class="logo" src="https://images.codestream.com/logos/cs-banner-1764x272.png" />
			</a>
			<div class="content">
				${content}
			</div>
			${buttons}
			<br/>
			<div class="following ensure-white">
				<span>You received this email because you are following this codemark.&nbsp;</span><span class="hover-underline"><a clicktracking="off" href="${unfollowLink}">Unfollow</a></span>
			</div>
			${tipDiv}
		</div>
	</body>
</html>
`;
	}
}

module.exports = EmailNotificationV2Renderer;
