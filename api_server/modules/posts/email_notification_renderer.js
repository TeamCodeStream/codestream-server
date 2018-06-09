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
			font-family: Roboto, Arial;
			font-size: 16px;
			color: #000;
		}
		.postWrapper {
			margin-bottom: 35px;
		}
		.authorLine {
			margin-bottom: 10px;
		}
		.author {
		  font-weight: bold;
		}
		.datetime {
			color: #888888;
			font-size: 14px;
		}
		.replyto {
		  color: #888888;
		  overflow: hidden;
			text-overflow: ellipsis;
			margin-bottom: 5px;
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
		.footnote {
			color: #888888
		}
	</style>
</head>
<html>
	<div class=master>
		<div>
			${postsContent}
		</div>
		<hr class=rule>
		${intro}
		<div class=footnote>
			Add to the discussion by replying to this email.<br/>
			<br/>
			Control notifications by emailing <a href="mailto:${supportEmail}">${supportEmail}</a>.
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

	// link that user should click on to learn about CodeStream and install the plugin
	getInstallLink (options) {
		const { user, mentioned } = options;
		const firstEmail = !user.get('hasReceivedFirstEmail');
		const campaign = (
			(firstEmail && mentioned && 'first_mention_notification_unreg') ||
			(firstEmail && !mentioned && 'first_newmessage_notification_unreg') ||
			(!firstEmail && mentioned && 'mention_notification_unreg') ||
			(!firstEmail && !mentioned && 'newmessage_notification_unreg')
		);
		return `http://get.codestream.com/invited?utm_medium=email&utm_source=product&utm_campaign=${campaign}`;
	}

	// determine the intro text of an email notification
	getNotificationIntro (options) {
		const { user, team } = options;
		const isRegistered = user.get('isRegistered');
		const firstEmail = !user.get('hasReceivedFirstEmail');
		const teamName = team.get('name');
		const installLink = this.getInstallLink(options);
		let intro;
		if (isRegistered) {
			/*
			if (offlineForRepo) {
				return 'We noticed that you don’t currently have this repo open in your IDE and didn’t want you to miss this discussion.';
			}
			else {
				return 'We noticed that you don’t currently have your IDE open and didn’t want you to miss this discussion.';
			}
*/
		}
		else if (firstEmail) {
			intro = `You’ve been added to ${teamName} on CodeStream, where your team is currently discussing code.<br><a clicktracking="off" href="${installLink}">Install CodeStream</a> to chat right from within your IDE.`;
		}
		else {
			intro = `<a clicktracking="off" href="${installLink}">Install CodeStream</a> to chat right from within your IDE.`;
		}
		if (intro) {
			return `<div class="intro">${intro}</div><br/>`;
		}
	}
}

module.exports = EmailNotificationRenderer;
