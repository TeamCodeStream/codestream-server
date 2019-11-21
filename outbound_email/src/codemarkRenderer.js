// provides a class to handle rendering a codemark as HTML for email notifications

'use strict';

const EmailUtilities = require('./server_utils/email_utilities');
const Utils = require('./utils');
const Crypto = require('crypto');
const Path = require('path');

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

const CODE_PROVIDERS = {
	github: 'GitHub',
	gitlab: 'GitLab',
	bitBucket: 'Bitbucket',
	'azure-devops': 'Azure DevOps',
	vsts: 'Azure DevOps'
};

const PROVIDER_DISPLAY_NAMES = {
	'github': 'GitHub',
	'bitbucket': 'Bitbucket',
	'gitlab': 'GitLab',
	'trello': 'Trello',
	'jira': 'Jira',
	'jiraserver': 'Jira Server',
	'asana': 'Asana',
	'youtrack': 'YouTrack',
	'slack': 'Slack',
	'msteams': 'Microsoft Teams',
	'azuredevops': 'Azure DevOps',
	'vsts': 'Visual Studio Team Services'
};

class CodemarkRenderer {

	/* eslint complexity: 0 */
	render (options) {
		const authorDiv = this.renderAuthorDiv(options);
		const titleDiv = this.renderTitleDiv(options);
		const visibleToDiv = this.renderVisibleToDiv(options);
		const tagsAssigneesTable = this.renderTagsAssigneesTable(options);
		const descriptionDiv = this.renderDescriptionDiv(options);
		const linkedIssuesDiv = this.renderLinkedIssuesDiv(options);
		const relatedDiv = this.renderRelatedDiv(options);
		const codeBlockDivs = this.renderCodeBlockDivs(options);

		return `
<div class="codemark-wrapper">
	${authorDiv}
	${titleDiv}
	${visibleToDiv}
	${tagsAssigneesTable}
	${descriptionDiv}
	${linkedIssuesDiv}
	${relatedDiv}
	${codeBlockDivs}
</div>
`;
	}

	// render the author line
	renderAuthorDiv (options) {
		const { codemark, creator, timeZone } = options;
		// the timestamp is dependent on the user's timezone, but if all users are from the same
		// timezone, we can format the timestamp here and fully render the email; otherwise we
		// have to do field substitution when we send the email to each user
		const datetime = timeZone ? Utils.formatTime(codemark.createdAt, timeZone) : '{{{datetime}}}';

		const author = creator ? (creator.username || EmailUtilities.parseEmail(creator.email).name) : '';
		const avatar = this.getAvatar(creator);
		return `
<div class="authorLine">
	<div style="max-height:0;max-width:0">
		<span class="headshot-initials">${avatar.authorInitials}</span>
	</div>
	<img class="headshot-image" src="https://www.gravatar.com/avatar/${avatar.emailHash}?s=20&d=blank" />
	<span class="author">${author}</span><span class="datetime">${datetime}</span>
</div>
`;
	}

	// render the div for the title
	renderTitleDiv (options) {
		const { codemark, mentionedUserIds, members } = options;
		// display title: the codemark title if there is one, or just the codemark text
		const title = Utils.prepareForEmail(codemark.title || codemark.text, mentionedUserIds, members);
		return `
<div class="text">
	${title}
	<br>
</div>
`;
	}

	// render the div for whom the codemark is visible, if a private codemark
	renderVisibleToDiv (options) {
		const { stream } = options;
		if (stream.privacy === 'public') {
			return '';
		}

		let usernames = this.getVisibleTo(options);
		return `
<div class="section" >VISIBLE TO</div>
<div class="text">${usernames}</div>
`;
	}

	// get the label to use for "visible to"
	getVisibleTo (options) {
		const { stream, members } = options;
		if (stream.type === 'channel') {
			return stream.name;
		}

		const usernames = [];
		for (let memberId of stream.memberIds) {
			const member = members.find(member => member.id === memberId);
			if (member) {
				usernames.push(member.username);
			}
		}

		if (usernames.length > 3) {
			const nOthers = usernames.length - 2;
			return `${usernames.slice(0, 2).join(', ')} & ${nOthers} others`;
		}
		else {
			return usernames.join(', ');
		}
	}

	// render the table for the tags and assignees, which are displayed side-by-side
	renderTagsAssigneesTable (options) {
		const { codemark, members } = options;

		let tagsHeader = '';
		if (codemark.tags && codemark.tags.length > 0) {
			tagsHeader = 'TAGS';
		}

		let assigneesHeader = '';
		let assignees = [];
		if (
			(codemark.assignees && codemark.assignees.length > 0) ||
			(codemark.externalAssignees && codemark.externalAssignees.length > 0)
		) {
			assigneesHeader = 'ASSIGNEES';
			(codemark.assignees || []).forEach(assigneeId => {
				const user = members.find(member => member.id === assigneeId);
				if (user) {
					assignees.push(user);
				}
			});
			assignees = [...assignees, ...(codemark.externalAssignees || [])];
		}

		let tagsAssigneesTable = '';
		if (tagsHeader || assigneesHeader) {
			tagsAssigneesTable = '<table class="tagsAssigneesTable"><tbody><tr class="section">';
			if (tagsHeader) {
				tagsAssigneesTable += `<td width=300px class="tagsAssignees">${tagsHeader}</td>`;
			}
			if (assigneesHeader) {
				tagsAssigneesTable += `<td width=300px class="tagsAssignees">${assigneesHeader}</td>`;
			}

			const numRows = assigneesHeader ? assignees.length : 1;
			for (let nRow = 0; nRow < numRows; nRow++) {
				tagsAssigneesTable += '</tr><tr class="text">';
				if (tagsHeader) {
					if (nRow === 0) {
						const tags = this.renderTags(options);
						tagsAssigneesTable += `<td width=300px class="tagsAssignees">${tags}</td>`;
					}
					else {
						tagsAssigneesTable += '<td width=300px class="tagsAssignees">&nbsp;</td>';
					}
				}
				if (assigneesHeader) {
					const assignee = this.renderAssignee(assignees[nRow]);
					tagsAssigneesTable += `<td width=300px class="tagsAssignees">${assignee}</id>`;
				}
				tagsAssigneesTable += '</tr>';
			}
			
			tagsAssigneesTable += '</tbody></table>';
		}

		return tagsAssigneesTable;
	}

	// render the set of tags
	renderTags (options) {
		const { codemark, team } = options;
		const tags = codemark.tags || [];
		const teamTags = team.tags || [];
		let tagsHtml = '';
		for (let tag of tags) {
			const teamTag = teamTags[tag];
			if (teamTag) {
				tagsHtml += this.renderTag(teamTag);
			}
		}
		return tagsHtml;
	}

	// render a single tag
	renderTag (teamTag) {
		const tagEmptyClass = teamTag.label ? '' : 'tag-empty';
		const label = teamTag.label || '&#8291;';
		const color = TAG_MAP[teamTag.color] || teamTag.color;
		return `<span class="tag ${tagEmptyClass}" style="background-color:${color};">${label}</span>`;
	}

	// render a single task assignee
	renderAssignee (assignee) {
		const avatar = this.getAvatar(assignee);
		const assigneeDisplay = assignee.fullName || assignee.displayName || assignee.username || assignee.email;
		return `
<div style="max-height:0;max-width:0">
	<span class="headshot-initials">${avatar.authorInitials}</span>
</div>
<img class="headshot-image" src="https://www.gravatar.com/avatar/${avatar.emailHash}?s=20&d=blank" />
<span class="assignee">${assigneeDisplay}</span>
`;

	}
	// render the description div, as needed
	renderDescriptionDiv (options) {
		const { codemark, mentionedUserIds, members } = options;
		// there is a description if there is both a title and text, in which case it's the text
		if (codemark.title && codemark.text) {
			const text = Utils.prepareForEmail(codemark.text, mentionedUserIds, members);
			return `
<div class="section">DESCRIPTION</div>
<div class="text">
	<span class="icon">
		<svg version="1.1" width="16" height="16" class="octicon octicon-description" aria-hidden="true" viewBox="0 0 24 24"><path d="M 4 3 A 1.0001 1.0001 0 1 0 4 5 L 20 5 A 1.0001 1.0001 0 1 0 20 3 L 4 3 z M 4 7 A 1.0001 1.0001 0 1 0 4 9 L 15 9 A 1.0001 1.0001 0 1 0 15 7 L 4 7 z M 4 11 A 1.0001 1.0001 0 1 0 4 13 L 20 13 A 1.0001 1.0001 0 1 0 20 11 L 4 11 z M 4 15 A 1.0001 1.0001 0 1 0 4 17 L 15 17 A 1.0001 1.0001 0 1 0 15 15 L 4 15 z M 4 19 A 1.0001 1.0001 0 1 0 4 21 L 20 21 A 1.0001 1.0001 0 1 0 20 19 L 4 19 z"></path>
		</svg>
	</span>
	${text}
</div>
`;
		}
		else {
			return '';
		}
	}

	// render any linked issues
	renderLinkedIssuesDiv (options) {
		const { codemark } = options;
		if (!codemark.externalProvider) { return; }
		const providerName = PROVIDER_DISPLAY_NAMES[codemark.externalProvider] || codemark.externalProvider;
		const providerUrl = codemark.externalProviderUrl;
		return `
<div class="section">LINKED ISSUES</div>
<div class="issue hover-underline">
	<a clicktracking="off" href="${providerUrl}">${providerName} ${providerUrl}</a>
</div>
`;
	}

	// render the related codemarks, if any
	renderRelatedDiv (options) {
		const { codemark, relatedCodemarks } = options;
		// list related codemarks, if any
		let relatedDivs = '';
		for (let relatedCodemarkId of codemark.relatedCodemarkIds || []) {
			const relatedCodemark = relatedCodemarks.find(relatedCodemark => relatedCodemark.id === relatedCodemarkId);
			if (relatedCodemark) {
				relatedDivs += this.renderRelatedCodemark(relatedCodemark, options);
			}
		}
		if (relatedDivs) {
			return `
<div class="section">RELATED</div>
${relatedDivs}
`;
		}
		else {
			return '';
		}
	}

	// render a related codemark
	renderRelatedCodemark (codemark, options) {
		const { markers } = options;
		let path = '';
		if (codemark.markerIds && codemark.markerIds.length > 0) {
			const markerId = codemark.markerIds[0];
			const marker = markers.find(marker => marker.id === markerId);
			if (marker) {
				path = this.getPathForMarker(marker, options);
			}
		}

		const relatedTitle = Utils.cleanForEmail(codemark.title || codemark.text);
		return `
<div class="text">
	<a clicktracking="off" href="${codemark.permalink}">
		<span class="related-codemark-text">${relatedTitle}</span><span class="related-codemark-file hover-underline">${path}</span>
	</a>
</div>
`;

	}

	// get appropriate path to display for a marker
	getPathForMarker (marker, options) {
		const { fileStreams, repos } = options;
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

		let path = '';
		if (file) {
			if (repoUrl) {
				path += `${repoUrl}/`;
			}
			path += file;
		}
		return path;
	}

	bareRepo (repo) {
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
	}

	// render the code block divs, if any
	renderCodeBlockDivs (options) {
		const { codemark, markers } = options;
		// display code blocks
		let codeBlockDivs = '';
		for (let markerId of codemark.markerIds || []) {
			const marker = markers.find(marker => marker.id === markerId);
			if (marker && marker.code) {
				codeBlockDivs += this.renderCodeBlock(marker, options);
			}
		}
		return codeBlockDivs;
	}

	// render a single code block
	renderCodeBlock (marker, options) {
		const { codemark } = options;
		const { branchWhenCreated, commitHashWhenCreated } = marker;
		const path = this.getPathForMarker(marker, options);
		const branch = branchWhenCreated || '';
		const commitHash = commitHashWhenCreated ? commitHashWhenCreated.slice(0, 7) : '';

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

		let code = (marker.code || '').trimEnd();

		// setup line numbering
		const numLines = code.split('\n').length;
		let lineNumbers = '';
		const locationWhenCreated = marker.locationWhenCreated || (marker.referenceLocations && marker.referenceLocations[0]);
		const startLine = (locationWhenCreated && locationWhenCreated.location && locationWhenCreated.location[0]) || 0;
		for (let i = 0; i < numLines; i++) {
			lineNumbers += `<span class="line-number">${startLine + 1 + i}.&nbsp;</span><br/>`;
		}

		let codeWidth = '100%';
		if (lineNumbers) {
			codeWidth = '90%';
			lineNumbers = `
<td width=10%>
	<div class="line-number-wrapper monospace">
		${lineNumbers}
	</div>
</td>
`;
		}
		if (path) {
			// do syntax highlighting for the code, based on the file extension
			let extension = Path.extname(path).toLowerCase();
			if (extension.startsWith('.')) {
				extension = extension.substring(1);
			}
			code = Utils.highlightCode(code, extension);
		}

		return `
<div class="codeblock">
	<span class="codeblock-text monospace">${path}</span>
	<span class="codeblock-text monospace">${branch}</span>
	<span class="codeblock-text monospace">${commitHash}</span>
</div>
<table cellspacing="0" cellpadding="0">
	<tr>
		${lineNumbers}
		<td width=${codeWidth}>
			<div class="code-wrapper monospace">${code}</div>
		</td>
	<tr>
</table>
${buttons}
`;
	}

	getAvatar (user) {
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
	}
}

module.exports = CodemarkRenderer;
