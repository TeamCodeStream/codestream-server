'use strict';

const MomentTimezone = require('moment-timezone');
const EmailUtilities = require('./server_utils/email_utilities');
const HtmlEscape = require('./server_utils/html_escape');
const HLJS = require('highlight.js');
const Crypto = require('crypto');
const Markdowner = require('./server_utils/markdowner');
const Path = require('path');

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
	
	// This provides a unified spot to wrap content in a "section.
	// All "sections" should have "padding" on the bottom (not top!)
	// Since padding does not work across all email clients, we resort to <br>
	// for certain clients
	renderSection(content) {
		return `<div class="section">${content}</div><!--[if mso]><br><![endif]-->`;
	},

	// render the div for the title
	renderTitleDiv: function (title, options) {
		title = Utils.prepareForEmail(title, options);
		return `
<div class="title">
	<span class="ensure-white">${title}</span>
	<br/>
</div>
`;
	},

	// render the description div, as needed
	renderDescriptionDiv: function (text, options) {
		if (text) {
			text = Utils.prepareForEmail(text, options);
			return this.renderSection(`
<div class="nice-gray section-text">DESCRIPTION</div>
<div class="description-wrapper">
<span class="ensure-white description">${text}</span>
</div>`);
		}
		else {
			return '';
		}
	},

	// render the author span portion of an email post
	renderAuthorSpan: function (creator, codemark, emote) {
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
	formatTime: function (timeStamp, timeZone) {
		timeZone = timeZone || 'America/New_York';
		return MomentTimezone.tz(timeStamp, timeZone).format('h:mm A MMM D');
	},

	// get the activity text associated with a particular codemark type
	getCodemarkActivity: function (codemark) {
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

	// render the table for the tags and assignees, which are displayed side-by-side
	renderTagsAssigneesTable: function (options) {
		const { assignees, tags, members, header } = options;
		let { externalAssignees } = options;

		let tagsHeader = '';
		if (tags && tags.length > 0) {
			tagsHeader = 'TAGS';
		}

		let assigneesHeader = '';
		let allAssignees = [];
		if (
			(assignees && assignees.length > 0) ||
			(externalAssignees && externalAssignees.length > 0)
		) {
			assigneesHeader = header;
			(assignees || []).forEach(assigneeId => {
				const user = members.find(member => member.id === assigneeId);
				if (user) {
					allAssignees.push(user);
				}
			});
			externalAssignees = (externalAssignees || []).filter(externalAssignee => {
				return !assignees.find(existingAssignee => {
					return existingAssignee.fullName === externalAssignee.displayName;
				});
			});
			allAssignees = [...allAssignees, ...externalAssignees];
		}

		let tagsAssigneesTable = '';
		if (tagsHeader || assigneesHeader) {
			tagsAssigneesTable = '<table cellpadding=0 cellspacing=0 border=0><tbody><tr>';
			if (tagsHeader) {
				tagsAssigneesTable += `<td width="300" style="width:300px;" class="nice-gray section-text">${tagsHeader}</td>`;				
			}
			if (assigneesHeader) {
				tagsAssigneesTable += `<td width="300" style="width:300px;" class="nice-gray section-text">${assigneesHeader}</td>`;
			}
			tagsAssigneesTable+='</tr><tr>';
			if (tagsHeader) {				
				const tags = Utils.renderTags(options);
				tagsAssigneesTable += `<td width="300" style="width:300px;" valign="top">${tags}</td>`;				
			}
			if (assigneesHeader) {
				tagsAssigneesTable += '<td width="300" style="width:300px;" valign=top><table>';
				for (let nRow = 0; nRow < allAssignees.length; nRow++) {							
					tagsAssigneesTable += `<tr><td>${this.renderAssignee(allAssignees[nRow])}</td></tr>`;												
				}
				tagsAssigneesTable+='</table></td>';
			}		
			
			tagsAssigneesTable += '</tr></tbody></table>';
		}
		if (tagsAssigneesTable) {
			return this.renderSection(tagsAssigneesTable);
		}
		return tagsAssigneesTable;
	},

	renderReviewStatus: function (options) {
		const { review } = options;

		let status = review.status;
		if (!status) return '';

		status = status.charAt(0).toUpperCase() + status.slice(1);		
		return this.renderSection(`<div class="nice-gray section-text">STATUS</div>
			<div class="description-wrapper">
				<span class="ensure-white description">${status}</span>
			</div>`);		
	},

	renderReviewReposAndFiles: function (options) {
		const { review, repos } = options;
		const reviewChangesets = review.reviewChangesets;
		if (!reviewChangesets || !reviewChangesets.length) return '';

		let reposAndBranches = `<table cellpadding=0 cellspacing=0 border=0><tr><td>
					<span class="nice-gray section-text">REPOSITORIES</span>
		</td></tr><tr><td>
		<table cellpadding=0 cellspacing=0 border=0><tr>`;
		for (const rc of reviewChangesets) {
			const repo = repos.find(_ => _.id === rc.repoId);
			if (repo) {
				reposAndBranches += `<tr><td class="pr-2">${Utils.renderIcon('repo')}</td>
				<td class="pr-8"><span class="ensure-white">${repo.name}</span></td></tr>`;
			}
			reposAndBranches += `<tr>
				<td class="pr-2">${Utils.renderIcon('git-branch')}</td>
				<td class="pr-8"><span class="ensure-white">${rc.branch}</span></td>
			</tr>`;
		}
		reposAndBranches+='</table></td></tr></table><br>';

		reposAndBranches += `<table cellpadding=0 cellspacing=0 border=0>
				<tr><td><span class="nice-gray section-text">CHANGED FILES</span></td></tr>`;
		for (const rc of reviewChangesets) {
			if (!rc.modifiedFiles) continue;
			
			for(const modifiedFile of rc.modifiedFiles) {
				const added = modifiedFile.linesAdded > 0 ? ` <span class="lines-added pr-4">+${modifiedFile.linesAdded}</span>`: '';
				const deleted = modifiedFile.linesRemoved > 0 ? ` <span class="lines-deleted">-${modifiedFile.linesRemoved}</span>`: '';
				reposAndBranches += `<tr><td><span class="monospace"><span class="ensure-white description pr-14">${modifiedFile.file}</span>${added}${deleted}</span></td></tr>`;
			}		 
		}
		reposAndBranches += '</table>';
		return this.renderSection(reposAndBranches);

	},

	// render a single task assignee
	renderAssignee (assignee) {
		const assigneeDisplay = assignee.fullName || assignee.displayName || assignee.username || assignee.email;
		const assigneeHeadshot = Utils.renderUserHeadshot(assignee);
		return `
			${assigneeHeadshot}
<span class="assignee">${assigneeDisplay}</span>
`;
	},

	// do syntax highlighting on a code block
	highlightCode: function (code, extension) {
		if (extension) {
			try {
				// this highlights and encodes html
				code = HLJS.highlight(extension, code).value;
			}
			catch (error) {
				error;
				// fallback on any error, including extensions that are not supported
				code = HtmlEscape.escapeHtml(code);
			}
		}
		else {
			code = HtmlEscape.escapeHtml(code);
		}
		return Utils.whiteSpaceToHtml(code);
	},

	// clean this text for email
	cleanForEmail: function (text) {
		return Utils.whiteSpaceToHtml(HtmlEscape.escapeHtml(text));
	},

	// convert whitespace in the passed text to html characters
	whiteSpaceToHtml: function (text) {
		return text
			.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
			.replace(/^ +/gm, match => { return match.replace(/ /g, '&nbsp;'); });
	},

	// handle mentions in the post text, for any string starting with '@', look for a matching
	// user in the list of mentioned users in the post ... if we find one, put styling on 
	// the mention
	handleMentions: function (text, options) {
		const { mentionedUserIds, members } = options;
		mentionedUserIds.forEach(userId => {
			const user = members.find(user => user.id === userId);
			if (user) {
				const username = user.username || EmailUtilities.parseEmail(user.email).name;
				const escapedUsername = username.replace(/(\[|\\|\^|\$|\.|\||\?|\*|\+|\(|\))/g, (match, char) => {
					return `\\${char}`;
				});
				const regexp = new RegExp(`@${escapedUsername}`, 'g');
				const mentionClass = `{{{mention${user.id}}}}`;
				text = text.replace(regexp, `<span class="${mentionClass}">@${username}</span>`);
			}
		});
		return text;
	},

	// get the default extension for displaying code
	// getExtension: function (options) {
	// 	const { codemark, review, markers } = options;
	// 	const parentObject = codemark || review;
	// 	const markerId = (parentObject.markerIds || [])[0];
	// 	if (!markerId) { return; }
	// 	const marker = markers.find(marker => marker.id === markerId);
	// 	if (!marker) { return; }
	// 	const file = Utils.getFileForMarker(marker, options);
	// 	if (!file) { return; }
	// 	let extension = Path.extname(file).toLowerCase();
	// 	if (extension.startsWith('.')) {
	// 		extension = extension.substring(1);
	// 	}
	// 	return extension;
	// },

	// get repo name appropriate to display a marker
	getRepoForMarker: function (marker, options) {
		const { repos } = options;
		let repoUrl = marker.repo || '';
		if (!repoUrl && marker.repoId) {
			const repo = repos.find(repo => repo.id === marker.repoId);
			if (repo && repo.remotes && repo.remotes.length > 0) {
				repoUrl = repo.remotes[0].normalizedUrl;
			}
		}
		if (repoUrl) {
			repoUrl = this.bareRepo(repoUrl);
		}
		return repoUrl;
	},

	// return the repo name for a given repo url
	bareRepo: function (repo) {
		if (repo.match(/^(bitbucket\.org|github\.com)\/(.+)\//)) {
			repo = repo
				.split('/')
				.splice(2)
				.join('/');
		} else if (repo.indexOf('/') !== -1) {
			repo = repo
				.split('/')
				.splice(1)
				.join('/');
		}
		return repo;
	},

	// get file name appropriate to display for a marker
	getFileForMarker: function (marker, options) {
		const { fileStreams } = options;
		let file = marker.file || '';
		if (marker.fileStreamId) {
			const fileStream = fileStreams.find(fileStream => fileStream.id === marker.fileStreamId);
			if (fileStream) {
				file = fileStream.file;
			}
		}
		if (file.startsWith('/')) {
			file = file.slice(1);
		}
		return file;
	},

	// prepare text for email by cleaning and apply mention replacement
	prepareForEmail: function (text, options) {
		const { extension } = options;
		// text = Utils.cleanForEmail(text);
		text = new Markdowner().markdownify(text);
		text = text.replace(/\n/g, '<br/>');
		text = text.replace(/<pre.*?>([\s\S]*)<\/pre>/gm, (match, code) => {
			code = code.replace(/<br\/>/g, '\n');
			code = Utils.highlightCode(code, extension);
			code = Utils.renderCode(code);
			return `<div class="code">${code}</div>`;
		});
		return Utils.handleMentions(text, options);
	},

	// get appropriate avatar information for displaying a user
	getAvatar: function (user) {
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

	// render buttons to display, associated with a codemark or a review
	renderButtons: function (options) {
		const { codemark, review, markers } = options;
		// in this case, we would have already rendered the buttons next to the codeblocks		
		if (codemark && codemark.markerIds && codemark.markerIds.length > 1) return '';

		if (review) {
			// if there's some kind of parented review, we use that
			return Utils.renderReviewButtons(options);
		}
		else if (codemark) {
			let marker;
			if (codemark.markerIds && codemark.markerIds.length) {
				const markerId = codemark.markerIds[0];
				if (markerId) {
					marker = markers.find(marker => marker.id === markerId);
				}
			}
			return Utils.renderMarkerButtons(options, marker);
		}

		return '';
	},

	// get buttons to display associated with a codemark or a review
	renderMarkerButtons: function (options, marker) {
		const { codemark } = options;		
		
		let remoteCodeUrl;		
		let ideUrl = Utils.getIDEUrl(codemark.permalink, marker ? { marker : marker.id } : undefined);		

		let hasRemoteCodeUrl = false;
		let remoteCodeProviderName = '';
		if (marker) {
			const remoteCodeUrlObject = marker.remoteCodeUrl || codemark.remoteCodeUrl;
			if (remoteCodeUrlObject) {
				remoteCodeProviderName = CODE_PROVIDERS[remoteCodeUrlObject.name];
				remoteCodeUrl = remoteCodeUrlObject.url;
				if (remoteCodeProviderName && remoteCodeUrl) {
					hasRemoteCodeUrl = true;
				}
			}
		}

		let markup = '';
		if (ideUrl || hasRemoteCodeUrl) {
			// need a table for MS Mail (desktop) or Outlook (desktop) as inline-block and/or max-width aren't supported			
			// using an empty row as a divider -- css margins don't work well
			let cellCount = 0;
			markup = `<table border="0" cellspacing="0" cellpadding="0">
			<tr>
			  <td>
				<table border="0" cellspacing="2" cellpadding="2">
				  <tr>`;
			if (ideUrl) {
				cellCount++;
				markup += `<td>
					  <a clicktracking="off" href="${ideUrl}" target="_blank" class="button"><span class="hover-underline">Open in IDE</span></a>
					</td>`;
			}
			if (hasRemoteCodeUrl) {
				if (ideUrl) {
					cellCount++;
					markup += '<td>&nbsp;</td>';
				}
				cellCount++;
				markup += `<td>
					  <a clicktracking="off" href="${remoteCodeUrl}" target="_blank" class="button"><span class="hover-underline">Open on ${remoteCodeProviderName}</span></a>
					</td>`;
			}
			markup += ` 
				  </tr>
				</table>
			  </td>
			</tr>`;
			if (cellCount > 0) {
				// add a buffer / separator to the bottom
				markup += '<tr><td>&nbsp;</td></tr>';
			}
			markup += '</table>';
		}

		return markup;
	},

	renderReviewButtons: function (options) {
		const { review } = options;	
		if (!review) return '';

		const ideUrl = Utils.getIDEUrl(review.permalink, null);
		if (!ideUrl) return '';		
		
		let markup = `<table border="0" cellspacing="0" cellpadding="0">
		<tr>
			<td>
			<table border="0" cellspacing="2" cellpadding="2">
				<tr><td>
					<a clicktracking="off" href="${ideUrl}" target="_blank" class="button"><span class="hover-underline">Open in IDE</span></a>
				</td></tr>
			</table>
			</td>
		</tr></table>`;		

		return markup;
	},

	// get the url for opening the entity that has a permalink in IDE
	getIDEUrl: function (permalink, additional) {		
		if (!permalink) {
			return '';
		}		
		let url = `${permalink}?ide=default`;
		if (additional) {
			for (const k of Object.keys(additional)) {
				url +=`&${k}=${additional[k]}`;
			}
		}
		return url;
	},

	// render a review or codemark (issue) title and author, with timestamp
	renderTitleAuthorDiv: function (options) {
		const { creator, datetimeField, title, icon } = options;
		const author = creator ? (creator.username || EmailUtilities.parseEmail(creator.email).name) : '';
		// the width="100%" is intended, and is a hack to ensure the first <td> only takes up 
		// the space that it needs and no more.
		return this.renderSection(`<table border="0" cellspacing="0" cellpadding="0" width="100%">
					<tr><td title="${icon}">${Utils.renderIcon(icon, { height: 25, width: 25})}</td>
						<td align="left" width="100%" style="text-align:left;padding:0px;margin:0px;"><span class="title-large ensure-white">${title}</span></td>
					</tr>
					<tr><td colspan="2"><span class="sub-title ensure-white">Opened by ${author} on {{{${datetimeField}}}}</span></td></tr></table>`);
	},

	renderAuthorDiv: function (options) {
		const { creator, datetimeField } = options;
		const author = creator ? (creator.username || EmailUtilities.parseEmail(creator.email).name) : '';
		const headshot = Utils.renderUserHeadshot(creator);
		return `
<div>
	${headshot}
	<span class="author">${author}</span>&nbsp;<span class="datetime">{{{${datetimeField}}}}</span>
</div>
`;
	},

	renderMeMessageDiv: function (options) {
		const { creator, datetimeField, meMessage } = options;
		const author = creator ? (creator.username || EmailUtilities.parseEmail(creator.email).name) : '';
		const headshot = Utils.renderUserHeadshot(creator);
		return `
<div>
	${headshot}
	<span class="author">${author}</span>&nbsp;<span class="me-text">${meMessage}</span>&nbsp;<span class="datetime">{{{${datetimeField}}}}</span>
</div>
`;
	},

	renderParentReviewDiv (options) {
		const { review } = options;
		if (review) {
			return this.renderSection(`<div class="nice-gray section-text">CODE REVIEW</div>
	${review.permalink ? `<a href="${review.permalink}" class="review-link" clicktracking="off">${review.title}</a>` : review.title}
	`);
		}
		else {
			return '';
		}
	},

	// render a gravatar headshot with initials as backup
	renderHeadshot: function (avatar) {
		// class doesn't seem to work in the `if mso` comment... inline the style.
		// whole lot of crap to make MS clients look nice...
		return `
		<!--[if mso]>
			<span style="background-color:#678;color:#1e1e1e;padding:2px;">${avatar.authorInitials.toUpperCase()}</span>&nbsp;
		<![endif]-->
		<!--[if !mso]> <!-->
		<div style="max-height:0;max-width:0;display:inline-block;">
			<span class="headshot-initials">${avatar.authorInitials}</span>
		</div>
		<div style="display:inline-block;">
			<img class="headshot-image" style="display:inline-block" src="https://www.gravatar.com/avatar/${avatar.emailHash}?s=20&d=blank" />
		</div>
		<!-- <![endif]-->
		`;
	},

	// render the set of tags
	renderTags: function (options) {
		const { tags = [], team } = options;
		const teamTags = team.tags || [];
		let hasTags = false;
		let tagsHtml = '<table cellpadding=1 cellspacing=1 border=0><tr>';
		const length = tags.length;
		let i = 1;
		for (let tag of tags) {
			hasTags = true;
			const teamTag = teamTags[tag];
			if (teamTag) {
				tagsHtml += Utils.renderTag(teamTag, i === length);
			}
			i++;
		}
		if (!hasTags) return '';

		return tagsHtml + '</tr></table>';
	},

	// render a single tag
	renderTag: function (teamTag, isLast) {
		const tagEmptyClass = teamTag.label ? '' : 'tag-empty';
		const label = teamTag.label || '&nbsp;';
		const color = TAG_MAP[teamTag.color] || teamTag.color;
		// insane width calc, because buttons as "roundrect"s need an actual width. hate.
		const msWidthBS = teamTag.label ? `width:${Math.max(teamTag.label.length * 9, 25)}px` : 'width:25px;';
		return `<td valign=top class="${isLast ? '' : 'pr-4'}">
		<!--[if mso]>
		<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" style="height:23px;${msWidthBS}v-text-anchor:middle;padding:0px;margin:0px" arcsize="10%" stroke="f" fillcolor="${color}">
			<w:anchorlock/>
			<center style="padding:0px;margin:0px;font-size:12px;">
				${label}
			</center>
		</v:roundrect>
		<![endif]-->
		<!--[if !mso]> <!-->
			<span class="tag ${tagEmptyClass}" style="background-color:${color};">${label}</span>
		<!-- <![endif]-->
		 </td>`;
	},

	// render the headshot or initials for a single task assignee
	renderUserHeadshot: function (user) {
		const avatar = Utils.getAvatar(user);
		return Utils.renderHeadshot(avatar);
	},

	// render the icon for a third-party provider
	renderIcon: function (name, options) {
		const icon = ICON_MAP[name] || name;
		const {width, height} = options && options.width && options.height 
			? options 
			: {width: 19, height: 19};
		return `<img width="${width}" height="${height}" src="${ICONS_ROOT}/${icon}.png" />`;
	},

	// turn code into an html table with line numbering
	renderCode: function (code, startLine = 0) {
		// setup line numbering
		const lines = code.trimEnd().split('\n');
		const numLines = lines.length;

		let codeHtml = '<table width="100%" cellspacing="0" cellpadding="0">';
		for (let i = 0; i < numLines; i++) {
			const lineNumber = `
<td width=10%>
	<div class="line-numbers monospace">
		${startLine + i + 1}.&nbsp;
	</div>
</td>
`;
			const codeLine = `
<td width=90%>
	<div class="monospace code-line">
		${lines[i]}
	</div>
</td>
`;
			codeHtml += `<tr>${lineNumber}${codeLine}</tr>`;
		}
		codeHtml += '</table>';
		return codeHtml;
	},

	// render the code block divs, if any
	renderCodeBlockDivs: function (options) {
		const { markerIds, markers } = options;
		// display code blocks
		let codeBlockDivs = '';
		for (let markerId of markerIds || []) {
			const marker = markers.find(marker => marker.id === markerId);
			if (marker && marker.code) {
				codeBlockDivs += this.renderCodeBlock(marker, options);
			}
		}
		return codeBlockDivs;
	},

	// render a single code block
	renderCodeBlock: function (marker, options) {
		const { branchWhenCreated, commitHashWhenCreated } = marker;
		const repo = Utils.getRepoForMarker(marker, options);
		const file = Utils.getFileForMarker(marker, options);
		const branch = branchWhenCreated || '';
		const commitHash = commitHashWhenCreated ? commitHashWhenCreated.slice(0, 7) : '';
		let code = (marker.code || '').trimEnd();

		// get buttons to display
		let buttons = '';
		if ((options.markerIds || []).length > 1) {
			buttons = Utils.renderMarkerButtons(options, marker, true);
		}
		
		// do syntax highlighting for the code, based on the file extension
		if (file) {
			let extension = Path.extname(file).toLowerCase();
			if (extension.startsWith('.')) {
				extension = extension.substring(1);
			}
			code = Utils.highlightCode(code, extension);
		}

		// get code for the given marker, render into a table with line numbering
		const locationWhenCreated = marker.locationWhenCreated || (marker.referenceLocations && marker.referenceLocations[0]);
		const startLine = (locationWhenCreated && locationWhenCreated.location && locationWhenCreated.location[0]) || 0;
		const codeHtml = Utils.renderCode(code, startLine);

		// get icons for heading
		const repoIcon = Utils.renderIcon('repo');
		const fileIcon = Utils.renderIcon('file');
		const branchIcon = Utils.renderIcon('git-branch');
		const commitIcon = Utils.renderIcon('git-commit');
		// need to use <td> padding for the spacing to work correctly since
		// margin doesn't work on all clients
		return `
<div class="codeblock-text">
	<table cellpadding=0 cellspacing=0 border=0>
		<tr>
			<td class="pr-2">${repoIcon}</td>
			<td class="pr-8"><span class="codeblock-heading">${repo}</span></td>
			<td class="pr-2">${fileIcon}</td>
			<td class="pr-8"><span class="codeblock-heading">${file}</span></td>
			<td class="pr-2">${branchIcon}</td>
			<td class="pr-8"><span class="codeblock-heading">${branch}</span></td>
			<td class="pr-2">${commitIcon}</td>
			<td class="pr-8"><span class="codeblock-heading">${commitHash}</span></td>
		</tr>
	</table>
</div>
<div class="code">
	<table border="0" cellspacing="2" cellpadding="2" bgcolor="#000000" width="100%">
		<tr>
			<td bgcolor="#000000">${codeHtml}</td>
		</tr>
	</table>
</div>
${buttons}
`;
	}
};

module.exports = Utils;