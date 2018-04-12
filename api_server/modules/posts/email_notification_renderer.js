// provides a class to handle rendering a single post as HTML for email notifications

'use strict';

const Path = require('path');

class EmailNotificationRenderer {

	// render an email notification for a given set of posts and a given user
	render (options) {
		const { posts, repo, stream } = options;
		const postsContent = posts.join('');
		const pathToFile = 'https://' + Path.join(repo.get('normalizedUrl'), stream.get('file'));
		const intro = this.getNotificationIntro(options);
		return `
<head>
	<style>
		.author {
		  height: 1.4em;
		  font-weight: bold;
		}
		.datetime {
		  color: #888888;
		}
		.code {
		  font-family: "Courier";
		}
		.codeContext {
		  font-family: "Courier";
		  color: #888888;
		}
		.codeBlock {
			margin-left: 20px;
			background-color: #f4f4f4;
		}
		.replyto {
		  color: #888888;
		  height: 1.4em;
		  overflow: hidden;
		  text-overflow: ellipsis;
		}
		.address {
		  color: #888888;
		}
		.rule {
			border-color: #ffffff;
		}
	</style>
</head>
<html>
	<div>
		${postsContent}
	</div>
	<br>
	<br>
	<div class="pathToFile">
		${pathToFile}
	</div>
	<br>
	<div class="intro">
		${intro}
	</div>
	<br>
	<div>
		Add to the discussion by replying to this email.
		<br>
		Control notifications by emailing <a href="mailto:support@codestream.com">support@codestream.com</a>.
	</div>
	<br>
	<div class="address">
		CodeStream, Inc.<br>
		12 E. 49th St. - 11th Floor,<br>
		New York, NY 10017
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
		const { user, team, offlineForRepo } = options;
		const isRegistered = user.get('isRegistered');
		const firstEmail = !user.get('hasReceivedFirstEmail');
		const teamName = team.get('name');
		const installLink = this.getInstallLink(options);
		if (isRegistered) {
			if (offlineForRepo) {
				return 'We noticed that you don’t currently have this repo open in your IDE and didn’t want you to miss this discussion.';
			}
			else {
				return 'We noticed that you don’t currently have your IDE open and didn’t want you to miss this discussion.';
			}
		}
		else if (firstEmail) {
			return `You’ve been added to ${teamName} on CodeStream, where your team is currently discussing code.<br><a clicktracking="off" href="${installLink}">Install CodeStream</a> to chat right from within your IDE.`;
		}
		else {
			return `<a clicktracking="off" href="${installLink}">Install CodeStream</a> to chat right from within your IDE.`;
		}
	}
}

module.exports = EmailNotificationRenderer;
