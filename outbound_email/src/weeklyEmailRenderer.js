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
			return !user.deactivated && !(team.removedMemberIds || []).includes(user.id);
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
		return this.renderSectionEntries(userData, 'myReviews', 'title', 'Feedback Requests Waiting on Your Review');
	}

	renderCodemarks (userData) {
		return this.renderSectionEntries(userData, 'myCodemarks', 'title', 'Open Comments/Issues');
	}

	renderMentions (userData) {
		return this.renderSectionEntries(userData, 'mentions', 'text', 'Mentions');
	}

	renderPosts (userData) {
		const section = (
			userData.myReviews.length === 0 &&
			userData.myCodemarks.length === 0 &&
			userData.mentions.length === 0
		) ? 'Unread Messages' : 'Other Unread Messages';
		return this.renderSectionEntries(userData, 'unreadPosts', 'text', section);
	}

	renderNew (userData) {
		return this.renderSectionEntries(userData, 'newCodemarksReviews', ['title', 'text'], 'New Feedback Requests, Comments & Issues');
	}

	renderResolved (userData) {
		return this.renderSectionEntries(userData, 'closedCodemarksReviews', ['title', 'text'], 'Resolved Feedback Requests, Comments & Issues');
	}

	renderSectionEntries(userData, collection, field, heading) {
		let contentHtml = '', moreHtml = '';
		let items = userData[collection];
		const sectionHtml = items.length > 0 ? `<div class="sub-heading ensure-white">&gt;&nbsp;${heading}</div>` : '';
		const sepHtml = items.length > 0 ? '<br/>' : '';
		if (items.length > MAX_PER_SECTION) {
			const wasLength = items.length;
			items = items.splice(0, MAX_PER_SECTION);
			moreHtml = `<div class="weekly-listing ensure-white">&nbsp;&nbsp;&nbsp;&nbsp;(${wasLength - MAX_PER_SECTION} more)</div>`;
		}
		items.forEach(item => {
			const attr = field instanceof Array ? field.find(f => !!item[f]) : field; // searches list of fields for first value with content
			const post = (item.isCodemark || item.isReview) ? this.teamData.posts.find(id => id === item.postId) : item;
			const parentPost = post && post.parentPostId ? 
				this.teamData.posts.find(p => p.id === post.parentPostId) : 
				null;
			const grandparentPost = parentPost && parentPost.parentPostId ? 
				this.teamData.posts.find(id => id === parentPost.parentPostId) : 
				null;
			const ancestorPost = grandparentPost || parentPost;
			const ancestorCodemark = ancestorPost && ancestorPost.codemarkId ? 
				this.teamData.codemarks.find(codemark => codemark.id === ancestorPost.codemarkId) : 
				null;
			const ancestorReview = ancestorPost && ancestorPost.reviewId ? 
				this.teamData.reviews.find(review => review.id === ancestorPost.reviewId) :
				null;
			const permalink = 
				(ancestorReview && ancestorReview.permalink) ||
				(ancestorCodemark && ancestorCodemark.permalink) ||
				item.permalink;

			const options = {
				members: this.teamData.users || [],
				mentionedUserIds: (post && post.mentionedUserIds) || [],
				currentUser: this.user
			};
			const creator = this.teamData.users.find(u => u.id === item.creatorId);
			const headshot = creator ? Utils.renderUserHeadshot(creator) : '';

			// for now, we're going to shorten the text first and then do mentions ... if shortening the text ruins the
			// mentions we'll live with it, but that should be rare (how often do you mention someone 100 characters in?)
			let text = item[attr] || '';
			text = text.replace(/\r\n/g, ' ').replace(/\n/g, ' ').replace(/\r/g, ' ');	// get rid of linefeeds completely, replace with spaces
			text = Utils.stripMarkdown(text);		// strip out all markdown
			text = HtmlEscape.unescapeHtml(text);	// but the strip markdown, as a side effect, escapes some html, so unescape it
			text = Utils.cleanForEmail(text);		// this will escape it again
			text = this.ellipsify(text);			// add ellipses for long messages
			text = Utils.handleMentions(text, options);	// put in mention-related html
			if (permalink) {
				text = `<a href="${permalink}">${text}</a>`;
			}
			contentHtml += `<div class="weekly-listing ensure-white">&nbsp;&nbsp;&nbsp;&nbsp;${headshot} ${text}</div>`; 
		});
		return sectionHtml + contentHtml + moreHtml + sepHtml;
	}

	ellipsify (text) {
		return text.length < 100 ? text : text.substring(0, 100) + '...';
	}
}


module.exports = WeeklyEmailRenderer;
