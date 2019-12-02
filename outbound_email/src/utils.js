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
	getButtons: function(options, marker) {
		const { codemark } = options;

		let ideButton = '';
		if (codemark.permalink) {
			const url = `${codemark.permalink}?ide=default&markerId=${marker.id}`;
			ideButton = `
<div class="button">
	<a clicktracking="off" href="${url}" target="_blank">Open in IDE</a>
</div>
`;
		}

		let remoteCodeButton = '';
		const remoteCodeUrl = marker.remoteCodeUrl || codemark.remoteCodeUrl;
		if (remoteCodeUrl) {
			const name = CODE_PROVIDERS[codemark.remoteCodeUrl.name];
			const url = codemark.remoteCodeUrl.url;
			if (name && url) {
				remoteCodeButton = `
<div class="button">
<a clicktracking="off" href="${url}" target="_blank">Open on ${name}</a>
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
	}
};


module.exports = Utils;