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

		let unsubscribeDiv = this.renderUnsubscribe(options);

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
							${unsubscribeDiv}
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

	renderUnsubscribe (options) {
		const { unsubscribeLink } = options;
		return `
<div class="unsubscribe-weekly">
		<a clicktracking="off" href="${unsubscribeLink}">Unsubscribe</a> from weekly activity emails.
</div>
`;
	}

	renderReviews (userData) {
		return this.renderSectionEntries(userData, 'myReviews', 'Feedback Requests Waiting on Your Review');
	}

	renderCodemarks (userData) {
		return this.renderSectionEntries(userData, 'myCodemarks', 'Open Issues');
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
		return this.renderSectionEntries(userData, 'unreads', section, true);
	}

	renderNew (userData) {
		return this.renderSectionEntries(userData, 'newCodemarksReviews', 'New Feedback Requests, Comments & Issues');
	}

	renderResolved (userData) {
		return this.renderSectionEntries(userData, 'closedCodemarksReviews', 'Resolved Feedback Requests, Comments & Issues');
	}

	renderSectionEntries(userData, collection, heading, groupReplies=false) {
		let contentHtml = '<table>', moreHtml = '';
		let items = userData[collection];
		const sectionHtml = items.length > 0 ? `<div class="sub-heading ensure-white">${heading}</div>` : '';
		const sepHtml = items.length > 0 ? '<br/>' : '';
		if (items.length > MAX_PER_SECTION) {
			const wasLength = items.length;
			items = items.splice(0, MAX_PER_SECTION);
			moreHtml = `<div class="weekly-listing ensure-white">&nbsp;&nbsp;&nbsp;&nbsp;(${wasLength - MAX_PER_SECTION} more)</div>`;
		}

		items.forEach(item => {
			const post = item.post || item;
			const { parentPost, grandparentPost } = post || {};
			const ancestorPost = grandparentPost || parentPost;
			const ancestorItem = ancestorPost && (ancestorPost.codemark || ancestorPost.review);
			const options = {
				members: this.teamData.users || [],
				currentUser: this.user
			};
			const permalink = item.permalink || (ancestorItem && ancestorItem.permalink);

			contentHtml += this.renderItemText(item, permalink, options);

			const replies = (
				item.replies &&
				item.replies[this.user.id] &&
				item.replies[this.user.id][collection]
			) || [];
			replies.forEach(reply => {
				const replyPermalink = (
					reply.permalink ||
					(reply.codemark && reply.codemark.permalink)
				);
				contentHtml += this.renderItemText(reply, replyPermalink || permalink, options, true);
			});
		});
		contentHtml += '</table>'
		return sectionHtml + contentHtml + moreHtml + sepHtml;
	}

	// render text for a single item
	renderItemText (item, permalink, options, isReply=false) {
		const creator = this.teamData.users.find(u => u.id === item.creatorId);
		const username = creator.username || EmailUtilities.parseEmail(creator.email).name;
		//const headshot = creator ? Utils.renderUserHeadshot(creator) : '';
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
		const icon = isReply ? 'has-reply' : this.getItemIcon(item);
		const iconHtml = icon ? Utils.renderIcon(icon) : '';
		const itemText = `<span class="author-weekly">${username}</span>:&nbsp;${text}`;
		const cell1 = isReply ? '&nbsp;' : iconHtml;
		const cell2 = isReply ? iconHtml : itemText;
		const cell3 = isReply ? itemText : '';
		const colspan = isReply ? '' : 'colspan=2';
		return `<tr class="weekly-listing ensure-white"><td>${cell1}</td><td ${colspan}>${cell2}</td><td>${cell3}</td></tr>`; 
	}

	// handle messages starting with /me, by removing /me and substituting username
	handleMeMessage (text, creator) {
		if (!text.startsWith('&#x2F;me ')) return text;
		const author = creator ? (creator.username || EmailUtilities.parseEmail(creator.email).name) : '';
		return `<span class="author-weekly">${author}</span>&nbsp;${text.substring(9)}`;
	}

	// get the icon appropriate for this item
	getItemIcon (item) {
		if (item.isReview) {
			return 'review';
		} else if (item.isCodemark) {
			if (item.type === 'comment' || item.type === 'issue') {
				const color = !item.pinned ? 'gray' : item.status === 'closed' ? 'purple' : 'green';
				return `marker-${item.type}-${color}`;
			} else {
				return item.type;
			}
		}
	}

	// limit text to 100 characters, with ellipses
	ellipsify (text) {
		return text.length < 100 ? text : text.substring(0, 100) + '...';
	}
}


module.exports = WeeklyEmailRenderer;
