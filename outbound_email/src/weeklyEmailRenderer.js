// provides a class to handle rendering a single post as HTML for email notifications

'use strict';

const Utils = require('./utils');
const HtmlEscape = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/html_escape');

const MAX_PER_SECTION = 20;

class WeeklyEmailRenderer {

	// render a weekly email for a given user
	render (options) {
		const { 
			user,
			styles,
			ideLinks,
			latestNews,
			teamData
		} = options;
		this.user = user;
		this.teamData = teamData;

		let inviteDiv = '';
		if (!user.isRegistered && user.inviteCode) {
			inviteDiv = `
<div class="ensure-white">
	Join your teammates on CodeStream.<br/>
	Your teammates don’t need to leave their IDE to discuss and review code. You shouldn’t either!<br/>
	<br/>
	1. Install the extension for ${ideLinks}.<br/>
	2. Paste in your invitation code:<br/>
	&nbsp;&nbsp;&nbsp;&nbsp;<b>${user.inviteCode}</b><br/>
	<br/>
</div>
`;
		}

		let content =  this.renderTeamContent(options);
		let latestNewsSection = '';
		if (latestNews) {
			latestNewsSection = `
<div class="heading ensure-white">
	Latest News
</div>
<div class="ensure-white">
	${latestNews}
</div>
`;
		}

		return `
<html>
	<head>
		<link href="http://cdnjs.cloudflare.com/ajax/libs/highlight.js/9.12.0/styles/default.min.css" rel="stylesheet" type="text/css">
		<style>
			${styles}
		</style>
	<!--[if mso]>
		<style type="text/css">	
			.content {border:0px !important;}
			.code {border:0px !important;}
		</style>
	<![endif]-->
	</head>
	<br/>
	<body width="100%" style="margin: 0; mso-line-height-rule: exactly;">	
		<table border="0" cellspacing="8" cellpadding="8" bgcolor="#1e1e1e" width="100%">
			<tr>
				<td bgcolor="#1e1e1e"> 
					<div class="master">
						<div>			 
							<a href="https://codestream.com" clicktracking="off">
								<img alt="CodeStream" class="logo" src="https://images.codestream.com/logos/cs-banner-400x60.png" />
							</a>
						</div>
						<!--[if mso]><br><br><![endif]-->
						<div>
							${inviteDiv}
							${content}
							${latestNewsSection}
							<br/>
							<br/>
							<div class="ensure-white">
								Turn this email off via Notification Settings in the CodeStream extension.
							</div>
						</div>
					</div>
				</td>
			</tr>
		</table>
	</body>
</html>
`;
	}

	renderTeamContent (options) {
		const { userData } = options;
		const { users, team } = userData;
		const membership = this.renderMembership(users, team);
		const yourActivity = this.renderYourActivity(userData);
		const teamActivity = this.renderTeamActivity(userData);
return `
						${membership}
						${yourActivity}
						${teamActivity}
`;
	}

	renderMembership (users, team) {
		const activeMembers = users.filter(user => {
			return !user.externalUserId && !user.deactivated && !(team.removedMemberIds || []).includes(user.id);
		});
		const memberDesc = activeMembers.length !== 1 ? `${activeMembers.length} total members`: '1 member';
		const unregisteredMembers = activeMembers.filter(user => !user.isRegistered);
		const invitesAddS = unregisteredMembers.length !== 1 ? 's' : '';
		const inviteDesc = unregisteredMembers.length > 0 ? `, with ${unregisteredMembers.length} outstanding invitation${invitesAddS}` : '';
		return `
<div class="ensure-white">
	${memberDesc}${inviteDesc}
</div>
<br/>
`;
	}

	renderYourActivity (userData) {
		const activity = (
			this.renderReviews(userData) +
			this.renderCodemarks(userData) + 
			this.renderMentions(userData) +
			this.renderPosts(userData)
		);
		if (activity) {
			return `
<div class="heading ensure-white">
	Your Activity
</div>
${activity}
</div>
`;
		} else {
			return '';
		}
	}

	renderTeamActivity (userData) {
		const activity = (
			this.renderNew(userData) +
			this.renderResolved(userData)
		);
		if (activity) {
			return `
<div class="heading ensure-white">
	Team Activity
</div>
${activity}
`;
		} else {
			return '';
		}
	}

	renderReviews (userData) {
		return this.renderSectionEntries(userData, 'myReviews', 'Feedback Requests Waiting on Your Review');
	}

	renderCodemarks (userData) {
		return this.renderSectionEntries(userData, 'myCodemarks', 'Open Comments/Issues');
	}

	renderMentions (userData) {
		return this.renderSectionEntries(userData, 'mentions', 'Mentions', true);
	}

	renderPosts (userData) {
		const section = (
			userData.myReviews.length === 0 &&
			userData.myCodemarks.length === 0 &&
			userData.mentions.length === 0
		) ? 'Unread Messages' : 'Other Unread Messages';
		return this.renderSectionEntries(userData, 'unreadPosts', section, true);
	}

	renderNew (userData) {
		return this.renderSectionEntries(userData, 'newCodemarksReviews', 'New Feedback Requests, Comments & Issues');
	}

	renderResolved (userData) {
		return this.renderSectionEntries(userData, 'closedCodemarksReviews', 'Resolved Feedback Requests, Comments & Issues');
	}

	renderSectionEntries(userData, collection, heading, groupReplies=false) {
		let contentHtml = '', moreHtml = '';
		let items = userData[collection];
		const sectionHtml = items.length > 0 ? `<div class="sub-heading ensure-white">${heading}</div>` : '';
		const sepHtml = items.length > 0 ? '<br/>' : '';
		if (items.length > MAX_PER_SECTION) {
			const wasLength = items.length;
			items = items.splice(0, MAX_PER_SECTION);
			moreHtml = `<div class="weekly-listing ensure-white">&nbsp;&nbsp;&nbsp;&nbsp;(${wasLength - MAX_PER_SECTION} more)</div>`;
		}
		items.forEach(item => {
			if (item.alreadyRendered) return; // ignore items already rendered as replies to common parents
			const post = item.post || item;
			const { parentPost, grandparentPost } = post || {};
			const allReplies = groupReplies ? this.findReplies(parentPost, grandparentPost, items): [];
			const ancestorPost = grandparentPost || parentPost;
			const ancestorItem = ancestorPost && (ancestorPost.codemark || ancestorPost.review);
			const options = {
				members: this.teamData.users || [],
				currentUser: this.user
			};
			const permalink = (ancestorItem && ancestorItem.permalink) || item.permalink;

			// if we have an ancestor (parent or grandparent) item, render the ancestor item and then sub-items underneath
			if (ancestorItem) {
				contentHtml += this.renderItemText(ancestorItem, permalink, options);
				allReplies.forEach(subItem => {
					contentHtml += this.renderItemText(subItem, item.permalink || permalink, options, 6);
				});
			} else {
				contentHtml += this.renderItemText(item, item.permalink || permalink, options);
			}
		});
		return sectionHtml + contentHtml + moreHtml + sepHtml;
	}

	// render text for a single item
	renderItemText (item, permalink, options, indent=0) {
		const creator = this.teamData.users.find(u => u.id === item.creatorId);
		const headshot = creator ? Utils.renderUserHeadshot(creator) : '';
		options = {
			...options,
			mentionedUserIds: item.mentionedUserIds || (item.post || {}).mentionedUserIds || []
		};

		// for now, we're going to shorten the text first and then do mentions ... if shortening the text ruins the
		// mentions we'll live with it, but that should be rare (how often do you mention someone 100 characters in?)
		let text = item.title || item.text;
		text = text.replace(/\r\n/g, ' ').replace(/\n/g, ' ').replace(/\r/g, ' ');	// get rid of linefeeds completely, replace with spaces
		text = Utils.stripMarkdown(text);		// strip out all markdown
		text = HtmlEscape.unescapeHtml(text);	// but the strip markdown, as a side effect, escapes some html, so unescape it
		text = Utils.cleanForEmail(text);		// this will escape it again
		text = this.ellipsify(text);			// add ellipses for long messages
		text = Utils.handleMentions(text, options);	// put in mention-related html
		text = this.handleMeMessage(text, creator); // handle messages starting with /me
		if (permalink) {
			permalink = permalink + '?src=WeeklyEmail';
			text = `<a class="weekly-email-atag" clicktracking="off" href="${permalink}"><span class="hover-underline">${text}</span></a>`;
		}
		const spaces = '&nbsp;'.repeat(indent);
		return `<div class="weekly-listing ensure-white">${spaces}${headshot} ${text}</div>`; 
	}

	// find all replies to the given parent or grandparent
	findReplies (parentPost, grandparentPost, items) {
		return items.filter(item => {
			const post = item.post || item;
			if (!post) return;
			if (
				(post.parentPost && parentPost && post.parentPost.id === parentPost.id) ||
				(post.grandparentPost && parentPost && post.grandparentPost.id === parentPost.id) ||
				(post.parentPost && grandparentPost && post.parentPost.id === grandparentPost.id) ||
				(post.grandparentPost && grandparentPost && post.grantparentPost.id === grandparentPost.id)
			) {
				item.alreadyRendered = true;
				return item;
			}
		});
	}

	// handle messages starting with /me, by removing /me and substituting username
	handleMeMessage (text, creator) {
		if (!text.startsWith('&#x2F;me ')) return text;
		const author = creator ? (creator.username || EmailUtilities.parseEmail(creator.email).name) : '';
		return `<span class="author-weekly">${author}</span>&nbsp;${text.substring(9)}`;
	}

	// limit text to 100 characters, with ellipses
	ellipsify (text) {
		return text.length < 100 ? text : text.substring(0, 100) + '...';
	}
}


module.exports = WeeklyEmailRenderer;
