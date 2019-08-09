// provides a class to handle rendering a single post as HTML for email notifications

'use strict';

class EmailNotificationRenderer {

	// render an email notification for a given set of posts and a given user
	render (options) {
		const { posts, supportEmail } = options;
		const postsContent = posts.join('');
		const intro = this.getNotificationIntro(options) || '';
		return `
<head>
	<link href="https://fonts.googleapis.com/css?family=Roboto" rel="stylesheet" type="text/css">
	<link href="https://fonts.googleapis.com/css?family=Roboto+Mono" rel="stylesheet" type="text/css">
	<link href="http://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/styles/default.min.css" rel="stylesheet" type="text/css">
	<style>

		@import url(http://fonts.googleapis.com/css?family=Roboto);	
		@import url(http://fonts.googleapis.com/css?family=Roboto+Mono);	

		.hljs{display:block;overflow-x:auto;padding:0.5em;color:#383a42;background:#fafafa}.hljs-comment,.hljs-quote{color:#a0a1a7;font-style:italic}.hljs-doctag,.hljs-keyword,.hljs-formula{color:#a626a4}.hljs-section,.hljs-name,.hljs-selector-tag,.hljs-deletion,.hljs-subst{color:#e45649}.hljs-literal{color:#0184bb}.hljs-string,.hljs-regexp,.hljs-addition,.hljs-attribute,.hljs-meta-string{color:#50a14f}.hljs-built_in,.hljs-class .hljs-title{color:#c18401}.hljs-attr,.hljs-variable,.hljs-template-variable,.hljs-type,.hljs-selector-class,.hljs-selector-attr,.hljs-selector-pseudo,.hljs-number{color:#986801}.hljs-symbol,.hljs-bullet,.hljs-link,.hljs-meta,.hljs-selector-id,.hljs-title{color:#4078f2}.hljs-emphasis{font-style:italic}.hljs-strong{font-weight:bold}.hljs-link{text-decoration:underline}

		.master {
			margin-top: 10px;
			color: #000;
		}
		.postWrapper {
			margin-bottom: 35px;
		}
		.authorLine {
			margin-bottom: 3px;
		}
		.author {
			font-weight: bold;
		}
		.datetime {
			color: #888888;
		}
		.replyto {
			color: #888888;
			overflow: hidden;
			text-overflow: ellipsis;
			margin-bottom: 5px;
		}
		.title {
			font-weight: bold;
			overflow: hidden;
			text-overflow: ellipsis;
			margin-bottom: 5px;
		}
		.titleWithText {
			font-weight: bold;
			overflow: hidden;
			text-overflow: ellipsis;
			margin-bottom: 5px;
			border-bottom: 1px dashed #dddddd;
		}
		.assigneesTitle {
			font-weight: bold;
		}
		.assignees {
			color: #000;
			line-height: 1.1em;
		}
		.text {
			color: #000;
			line-height: 1.1em;
		}
		.mention {
			color: #009aef;
			font-weight: bold;
		}
		.codeBlock {
			background-color: #f8f8f8;
			border: 1px solid #dddddd;
			border-radius: 3px;
		}
		.pathToFile {
			color: #333;
			text-align: center;
			padding: 3px;
			border-bottom: 1px dashed #dddddd;
		}
		.code {
			font-family: "Roboto Mono", Courier;
			color: #000;
			padding: 5px 12px 5px 12px;
		}
		.codeContext {
			font-family: "Roboto Mono", Courier;
			color: #888888;
		}
		.address {
			color: #888888;
		}
		.rule {
			border: 1px solid #e0e0e0;
			margin-bottom: 15px;
		}
	</style>
</head>
<html>
	<div class=master>
		<div>
			${postsContent}
		</div>
		<hr class=rule>
		<div class=intro>
			${intro}
			<br/>
			Control notifications by emailing <a href="mailto:${supportEmail}">${supportEmail}</a>.<br/>
		</div>
<!--
		<br>
		<div class="address">
			CodeStream, Inc.<br>
			12 E. 49th St. - 11th Floor,<br>
			New York, NY 10017
		</div>
-->
	</div>
</html>
`;
	}

	// determine the intro text of an email notification
	getNotificationIntro (options) {
		const { user, team, inboundEmailDisabled } = options;
		if (user.isRegistered) {
			return inboundEmailDisabled ? '' : 'Add to the discussion by replying to this email.<br/>';
		}
		let intro = '';
		if (!user.hasReceivedFirstEmail) {
			intro = `You’ve been added to ${team.name} on CodeStream, where your team is currently discussing code.<br/><br/>`;
		}

		const link = 'https://codestream.com/?utm_medium=email&utm_source=product&utm_campaign=newmessage_notification_unreg';
		intro += `<a clicktracking="off" href="${link}">Install the CodeStream extension</a> for your IDE`;
		if (!inboundEmailDisabled) {
			intro += ', or add to the discussion by replying to this email.<br/>';
		}
		else {
			intro += '.<br/>';
		}
		return intro;
	}
}

module.exports = EmailNotificationRenderer;
