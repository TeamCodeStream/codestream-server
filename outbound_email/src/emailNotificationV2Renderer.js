// provides a class to handle rendering a single post as HTML for email notifications

'use strict';

const CODE_PROVIDERS = {
	github: 'GitHub',
	gitlab: 'GitLab',
	bitBucket: 'Bitbucket',
	'azure-devops': 'Azure DevOps',
	vsts: 'Azure DevOps'
};

const BUTTON_TEMPLATE = `
<table width="100%" cellspacing="0" cellpadding="0">
	<tr>
		<td>
			<table cellspacing="0" cellpadding="0">
				<tr>
					<td class=”button”>
						<a clicktracking="off" href="{{{link}}}" target="_blank">
							{{{text}}}
						</a>
					</td>
				</tr>
			</table>
		</td>
	</tr>
</table>
`;

const MakeButton = (text, link) => {
	return BUTTON_TEMPLATE.replace('{{{link}}}', link).replace('{{{text}}}', text);
};

class EmailNotificationV2Renderer {

	// render an email notification for a codemark or reply and for a given user
	render (options) {
		const { content, unfollowLink, inboundEmailDisabled, codemark } = options;
		let tipDiv = '';
		if (!inboundEmailDisabled) {
			tipDiv = `
<div class=tip>
	Tip: post a reply to this codemark by replying to this email directly.
</div>
`;
		}

		let ideButton = '';
		if (codemark && codemark.permalink) {
			ideButton = MakeButton('Open in IDE', `${codemark.permalink}?ide=default`);
		}

		let remoteCodeButton = '';
		if (codemark && codemark.remoteCodeUrl) {
			const name = CODE_PROVIDERS[codemark.remoteCodeUrl.name];
			const url = codemark.remoteCodeUrl.url;
			if (name && url) {
				remoteCodeButton = MakeButton(`Open on ${name}`, url);
			}
		}
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
		.codemarkWrapper {
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
		<div class=content>
			${content}
		</div>
		${ideButton}
		${remoteCodeButton}
		<div class=followingLine>
			<span class=following>You are following this codemark.&nbsp;</span><a clicktracking="off" href="${unfollowLink}">Unfollow</a>
		</div>
		${tipDiv}
	</div>
</html>
`;
	}
}

module.exports = EmailNotificationV2Renderer;
