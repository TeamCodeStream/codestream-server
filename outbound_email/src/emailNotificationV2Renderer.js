// provides a class to handle rendering a single post as HTML for email notifications

'use strict';

const Utils = require('./utils');

class EmailNotificationV2Renderer {

	// render an email notification for a codemark or reply and for a given user
	render (options) {
		const { 
			user,
			content,
			unfollowLink,
			unsubscribeLink,
			unsubscribeType,
			inboundEmailDisabled,
			needButtons,
			review,
			codeError,
			userIsRegistered,
			ideLinks,
			isReply,
			userBeingAddedToTeam,
			company,
			isReplyToCodeAuthor
		} = options;
		const what = codeError ? 'code error' : review ? 'feedback request' : 'codemark';

		const installText = `
<br/>
1. Install the extension for ${ideLinks}.<br/>
2. Sign up using <b>${user.email}</b>.<br/>
`;
		const unfollowTextPart = userIsRegistered && !userBeingAddedToTeam ? ` this ${what}` : '';
		const unfollowText = unfollowLink ? `&nbsp;</span><span class="hover-underline"><a clicktracking="off" href="${unfollowLink}">Unfollow</a></span>${unfollowTextPart}.` : '';
		const unsubscribeText = unsubscribeLink ? `&nbsp;<span class="hover-underline"><a clicktracking="off" href="${unsubscribeLink}">Unsubscribe</a></span> from ${unsubscribeType} emails.` : '';

		let firstFooterDiv = '', secondFooterDiv = '', inviteDiv = '';
		if (userIsRegistered) {
			if (userBeingAddedToTeam) {
				firstFooterDiv = `
<div class="following ensure-white">
	<span>You received this email because you’ve been added to the ${company.name} organization.${unfollowText}
</div>
`;
				const replyPart = inboundEmailDisabled ? 'G' : 'Reply to this email, or g';
				secondFooterDiv = `
<div class="ensure-white">
	${replyPart}o to the team by selecting "Organizations" under the headshot menu in the CodeStream extension.
</div>
`;

			} else {
				firstFooterDiv = `
<div class="following ensure-white">
	<span>You received this email because you are following this ${what}.${unfollowText}${unsubscribeText}
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
	You received this email because you were added to CodeStream.${unfollowText}
</div>
`;
			}

			const inviteMessage = isReplyToCodeAuthor ?
				'CodeStream provides tools to review code right in your IDE and your teammate is using them to comment on the changes you just committed.' :
				'Review these changes in your IDE using CodeStream.';

			if (review) {
				inviteDiv = `
<div class="ensure-white">
	${inviteMessage}<br/>
	${installText}
	<br/>
</div>
`;
			}
			else {
				const replyPart = inboundEmailDisabled ? 'I' : 'Reply to this email or i';
				inviteDiv = `
<div class="ensure-white">
	${replyPart}nstall codestream to view in your IDE.<br/>
	${installText}
	<br/>
</div>
`;
			}
		}

		let buttons = '';
		if (needButtons) {
			buttons = Utils.renderButtons(options);
		}

		// trigger error in secret as needed
		if (
			content.match(/nr codemark email error/) &&
			(
				user.email.match(/codestream\.com$/) ||
				user.email.match(/newrelic\.com$/)
			) 
		) {
			throw new Error('hash table index out of range');
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
							<img alt="CodeStream" class="logo" src="https://images.codestream.com/logos/nrcs_logo_400x100_dark.png" />
						</a>
						<!--[if mso]><br><br><![endif]-->
						${inviteDiv}
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
						<br/>					
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
