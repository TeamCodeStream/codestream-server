'use strict';

const MomentTimezone = require('moment-timezone');
const EmailUtilities = require('./server_utils/email_utilities');
const HtmlEscape = require('./server_utils/html_escape');
const HLJS = require('highlight.js');
const Crypto = require('crypto');

const CODE_PROVIDERS = {
	github: 'GitHub',
	gitlab: 'GitLab',
	bitBucket: 'Bitbucket',
	'azure-devops': 'Azure DevOps',
	vsts: 'Azure DevOps'
};

const TAG_MAP = {
	blue: '#3578ba',
	green: '#7aba5d',
	yellow: '#edd648',
	orange: '#f1a340',
	red: '#d9634f',
	purple: '#b87cda',
	aqua: '#5abfdc',
	gray: '#888888'
};

const ICON_MAP = {
	jiraserver: 'jira',
};

const ICONS_ROOT = 'https://images.codestream.com/email_icons';

const Utils = {

	// render the author span portion of an email post
	renderAuthorSpan: function(creator, codemark, emote) {
		const author = creator.username || EmailUtilities.parseEmail(creator.email).name;
		let text = `<span class="author">${author}&nbsp;</span>`;
		if (codemark) {
			const codemarkText = Utils.getCodemarkActivity(codemark);
			text += `${codemarkText}&nbsp;&nbsp;`;
		}
		else if (emote) {
			text += `${emote}&nbsp;&nbsp;`;
		}
		else {
			text += '&nbsp;';
		}
		return text;
	},

	// format date/time display for email render, taking into account the given time zone
	formatTime : function(timeStamp, timeZone) {
		timeZone = timeZone || 'America/New_York';
		return MomentTimezone.tz(timeStamp, timeZone).format('h:mm A MMM D');
	},
	
	// get the activity text associated with a particular codemark type
	getCodemarkActivity: function(codemark) {
		switch (codemark.type) {
		case 'question': 
			return 'has a question';
		case 'issue': 
			return 'posted an issue';
		case 'bookmark': 
			return 'set a bookmark';
		case 'trap':
			return 'created a code trap';
		default:
			return 'commented on code';	// shouldn't happen, just a failsafe
		}
	},

	// do syntax highlighting on a code block
	highlightCode: function(code, extension) {
		if (extension) {
			code = HLJS.highlight(extension, code).value;
		}
		return Utils.whiteSpaceToHtml(code);
	},

	// clean this text for email
	cleanForEmail: function(text) {
		return Utils.whiteSpaceToHtml(HtmlEscape.escapeHtml(text));
	},

	// convert whitespace in the passed text to html characters
	whiteSpaceToHtml: function(text) {
		return text
			.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
			.replace(/^ +/gm, match => { return match.replace(/ /g, '&nbsp;'); })
			.replace(/\n/g, '<br/>');
	},

	// handle mentions in the post text, for any string starting with '@', look for a matching
	// user in the list of mentioned users in the post ... if we find one, put styling on 
	// the mention
	handleMentions: function(text, mentionedUserIds, members) {
		mentionedUserIds.forEach(userId => {
			const user = members.find(user => user.id === userId);
			if (user) {
				const username = user.username || EmailUtilities.parseEmail(user.email).name;
				const regexp = new RegExp(`@${username}`, 'g');
				text = text.replace(regexp, `<span class=mention>@${username}</span>`);
			}
		});
		return text;
	},

	// prepare text for email by cleaning and apply mention replacement
	prepareForEmail: function(text, mentionedUserIds, members) {
		text = Utils.cleanForEmail(text);
		return Utils.handleMentions(text, mentionedUserIds, members);
	},

	// get appropriate avatar information for displaying a user
	getAvatar: function(user) {
		const { email, fullName, displayName, username } = user;
		let emailHash = '-';
		let authorInitials;
		if (email) {
			emailHash = Crypto.createHash('md5')
				.update(email.trim().toLowerCase())
				.digest('hex');
			authorInitials = email.charAt(0) || '';
		}

		const name = displayName || fullName;
		if (name) {
			authorInitials = name
				.replace(/(\w)\w*/g, '$1')
				.replace(/\s/g, '');
			if (authorInitials.length > 2) {
				authorInitials = authorInitials.substring(0, 2);
			}
		}
		else if (username) {
			authorInitials = username.charAt(0);
		}
		return {
			authorInitials,
			emailHash
		};
	},

	// get buttons to display associated with a codemark
	renderCodemarkButtons: function(options, marker) {
		const { codemark } = options;

		let ideButton = '';
		if (codemark.permalink) {
			const url = Utils.getIDEUrl(options, marker.id);
			ideButton = `
<div class="button hover-button">
	<a clicktracking="off" href="${url}" target="_blank"><span class="hover-underline">Open in IDE</span></a>
</div>
`;
		}

		let remoteCodeButton = '';
		const remoteCodeUrl = marker.remoteCodeUrl || codemark.remoteCodeUrl;
		if (remoteCodeUrl) {
			const name = CODE_PROVIDERS[codemark.remoteCodeUrl.name];
			const url = remoteCodeUrl.url;
			if (name && url) {
				remoteCodeButton = `
<div class="button hover-button">
	<a clicktracking="off" href="${url}" target="_blank"><span class="hover-underline">Open on ${name}</span></a>
</div>
`;
			}
		}

		let buttons = '';
		if (ideButton || remoteCodeButton) {
			buttons = `
<div class="code-buttons">
	${ideButton}
	${remoteCodeButton}
</div>
`;
		}

		return buttons;
	},
 
	// get the url for opening the codemark in IDE
	getIDEUrl: function(options, markerId) {
		const { codemark } = options;
		if (!codemark.permalink) {
			return '';
		}
		markerId = markerId || (codemark.markerIds || [])[0];
		let url = `${codemark.permalink}?ide=default`;
		if (markerId) {
			url += `&marker=${markerId}`;
		}
		return url;
	},

	// render an author line, with timestamp
	renderAuthorDiv: function(options) {
		const { time, creator, datetimeField, timeZone } = options;
		// the timestamp is dependent on the user's timezone, but if all users are from the same
		// timezone, we can format the timestamp here and fully render the email; otherwise we
		// have to do field substitution when we send the email to each user
		const datetime = timeZone ? Utils.formatTime(time, timeZone) : `{{{${datetimeField}}}}`;

		const author = creator ? (creator.username || EmailUtilities.parseEmail(creator.email).name) : '';
		const headshot = Utils.renderUserHeadshot(creator);
		return `
<div>
	${headshot}
	<span class="author">${author}</span><span class="datetime">${datetime}</span>
</div>
`;
	},

	// render a gravatar headshot with initials as backup
	renderHeadshot: function(avatar) {
		return `
<div style="max-height:0;max-width:0;display:inline-block;">
	<span class="headshot-initials">${avatar.authorInitials}</span>
</div>
<div style="display:inline-block;">
	<img class="headshot-image" style="display:inline-block"src="https://www.gravatar.com/avatar/${avatar.emailHash}?s=20&d=blank" />
</div>
`;	
	},

	// render the set of tags
	renderTags: function(options) {
		const { codemark, team } = options;
		const tags = codemark.tags || [];
		const teamTags = team.tags || [];
		let tagsHtml = '';
		for (let tag of tags) {
			const teamTag = teamTags[tag];
			if (teamTag) {
				tagsHtml += Utils.renderTag(teamTag);
			}
		}
		return tagsHtml;
	},

	// render a single tag
	renderTag: function(teamTag) {
		const tagEmptyClass = teamTag.label ? '' : 'tag-empty';
		const label = teamTag.label || '&#8291;';
		const color = TAG_MAP[teamTag.color] || teamTag.color;
		return `<span class="tag ${tagEmptyClass}" style="background-color:${color};">${label}</span>`;
	},

	// render the headshot or initials for a single task assignee
	renderUserHeadshot: function(user) {
		const avatar = Utils.getAvatar(user);
		return Utils.renderHeadshot(avatar);
	},

	// render the icon for a third-party provider
	renderIcon: function(name) {
		const icon = ICON_MAP[name] || name;
		return `<img width="16" height="16" src="${ICONS_ROOT}/${icon}.png" />`;
	}
};


module.exports = Utils;