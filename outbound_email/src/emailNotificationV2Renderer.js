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
						<div class="following ensure-white">
							<span>You received this email because you are following this codemark.&nbsp;</span><span class="hover-underline"><a clicktracking="off" href="${unfollowLink}">Unfollow</a></span>
						</div>
						${tipDiv}
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
