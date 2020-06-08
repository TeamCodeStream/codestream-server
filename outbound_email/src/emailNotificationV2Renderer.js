// provides a class to handle rendering a single post as HTML for email notifications

'use strict';

const Utils = require('./utils');

class EmailNotificationV2Renderer {

	// render an email notification for a codemark or reply and for a given user
	render (options) {
		const { 
			content,
			unfollowLink,
			inboundEmailDisabled,
			needButtons,
			review,
			userIsRegistered,
			ideLinks,
			isReply,
			inviteCode,
			userBeingAddedToTeam,
			teamName
		} = options;
		const what = review ? 'review' : 'codemark';

		const installWithInviteCode = `
<br/>
1. Install the extension for ${ideLinks}.<br/>
2. Paste in your invitation code:<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<b>${inviteCode}</b><br/>
`;

		let firstFooterDiv = '', secondFooterDiv = '';
		if (userIsRegistered) {
			if (userBeingAddedToTeam) {
				firstFooterDiv = `
<div class="following ensure-white">
	<span>You received this email because you’ve been added to the ${teamName} team.&nbsp;<span class="hover-underline"><a clicktracking="off" href="${unfollowLink}">Unfollow</a></span>		
</div>
`;
				const replyPart = inboundEmailDisabled ? 'G' : 'Reply to this email, or g';
				secondFooterDiv = `
<div class="ensure-white">
	${replyPart}o to the team by selecting “Switch Teams” under the ellipses menu in the CodeStream extension.
</div>
`;

			}
			else {
				firstFooterDiv = `
<div class="following ensure-white">
	<span>You received this email because you are following this ${what}.&nbsp;</span><span class="hover-underline"><a clicktracking="off" href="${unfollowLink}">Unfollow</a></span>
</div>
`;
				if (!inboundEmailDisabled) {
					secondFooterDiv = `
<div class="ensure-white">
	Tip: post a reply to this ${what} by replying to this email directly.
</div>
`;
				}
			}
		}
		else {
			if (isReply) {
				secondFooterDiv = `
<div class="following ensure-white">
	<br/>
	You received this email because you were added to CodeStream. <span class="hover-underline"><a clicktracking="off" href="${unfollowLink}">Unfollow</a></span>
</div>
`;
			}

			if (review) {
				firstFooterDiv = `
<div class="ensure-white">
	<br/>
	Perform this code review in your IDE using CodeStream.<br/>
	${installWithInviteCode}
</div>
`;
			}
			else {
				const replyPart = inboundEmailDisabled ? 'I' : 'Reply to this email or i';
				firstFooterDiv = `
<div class="ensure-white">
	${replyPart}nstall codestream to view in your IDE.<br/>
	${installWithInviteCode}
</div>
`;
			}
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
	<!--[if mso]>
		<style type="text/css">	
			.content {border:0px !important;}
			.code {border:0px !important;}
		</style>
	<![endif]-->
	</head>
	<body width="100%" style="margin: 0; mso-line-height-rule: exactly;">	
		<table border="0" cellspacing="8" cellpadding="8" bgcolor="#1e1e1e" width="100%">
			<tr>
				<td bgcolor="#1e1e1e"> 
					<div class="master">				 
						<a href="https://codestream.com" clicktracking="off">
							<img alt="CodeStream" class="logo" src="https://images.codestream.com/logos/cs-banner-400x60.png" />
						</a>
						<!--[if mso]><br><br><![endif]-->
						<div class="content">	
						<!--[if mso]><table border="0" cellspacing="5" cellpadding="5" bordercolor="#282828" bgcolor="#282828" width="100%"><![endif]-->							
						<!--[if !mso]> <!--><table border="0" cellspacing="0" cellpadding="0" bordercolor="#282828" bgcolor="#282828" width="100%"><!-- <![endif]-->
								<tr>
									<td bgcolor="#282828"> 						
										${content}														
									</td>
								</tr>
							</table>						 
						</div>
						${buttons}						
						${firstFooterDiv}
						${secondFooterDiv}
					</div>				 			 
				</td>
			</tr>
		</table>	 
	</body>
</html>
`;
	}
}

module.exports = EmailNotificationV2Renderer;
