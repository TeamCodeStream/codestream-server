// provides a class to handle rendering a codemark as HTML for email notifications

'use strict';

const Utils = require('./utils');
const Path = require('path');

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
	
		options.extension = Utils.getExtension(options);

		const authorDiv = this.renderAuthorDiv(options);
		const titleDiv = this.renderTitleDiv(options);
		const visibleToDiv = this.renderVisibleToDiv(options);
		const tagsAssigneesTable = this.renderTagsAssigneesTable(options);
		const descriptionDiv = this.renderDescriptionDiv(options);
		const linkedIssuesDiv = this.renderLinkedIssuesDiv(options);
		const relatedDiv = this.renderRelatedDiv(options);
		const codeBlockDivs = this.renderCodeBlockDivs(options);

		return `
<div class="inner-content new-content">
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
		const authorOptions = {
			time: codemark.createdAt,
			creator,
			timeZone,
			datetimeField: 'datetime'
		};
		return Utils.renderAuthorDiv(authorOptions);
	}

	// render the div for the title
	renderTitleDiv (options) {
		const { codemark } = options;
		// display title: the codemark title if there is one, or just the codemark text
		const title = Utils.prepareForEmail(codemark.title || codemark.text, options);
		return `
<div class="title">
	<span class="ensure-white">${title}</span>
	<br/>
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
<div class="section nice-gray section-text" >VISIBLE TO</div>
<div>${usernames}</div>
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
			const externalAssignees = (codemark.externalAssignees || []).filter(externalAssignee => {
				return !assignees.find(existingAssignee => {
					return existingAssignee.fullName === externalAssignee.displayName;
				});
			});
			assignees = [...assignees, ...externalAssignees];
		}

		let tagsAssigneesTable = '';
		if (tagsHeader || assigneesHeader) {
			tagsAssigneesTable = '<table class="section" cellpadding=0 cellspacing=0 border=0><tbody><tr>';
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
				for (let nRow = 0; nRow < assignees.length; nRow++) {							
					tagsAssigneesTable += `<tr><td>${this.renderAssignee(assignees[nRow])}</td></tr>`;												
				}
				tagsAssigneesTable+='</table></td>';
			}		
			
			tagsAssigneesTable += '</tr></tbody></table><br>';
		}

		return tagsAssigneesTable;
	}

	// render a single task assignee
	renderAssignee (assignee) {
		const assigneeDisplay = assignee.fullName || assignee.displayName || assignee.username || assignee.email;
		const assigneeHeadshot = Utils.renderUserHeadshot(assignee);
		return `
			${assigneeHeadshot}
<span class="assignee">${assigneeDisplay}</span>
`;
	}

	// render the description div, as needed
	renderDescriptionDiv (options) {
		const { codemark } = options;
		// there is a description if there is both a title and text, in which case it's the text
		if (codemark.title && codemark.text) {
			const text = Utils.prepareForEmail(codemark.text, options);
			const iconHtml = Utils.renderIcon('description');
			// F MS -- can't even get an icon on a single line... just hide it for those fools
			return `
<div class="section nice-gray section-text">DESCRIPTION</div>
<div class="description-wrapper">
	<!--[if !mso]> <!-->${iconHtml}&nbsp;<!-- <![endif]-->
	<span class="ensure-white description">${text}</span>
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
		if (!codemark.externalProvider) { return ''; }
		const providerName = PROVIDER_DISPLAY_NAMES[codemark.externalProvider] || codemark.externalProvider;
		const providerUrl = codemark.externalProviderUrl;
		let iconHtml = Utils.renderIcon(codemark.externalProvider);
		return `
<div class="section nice-gray section-text">LINKED ISSUES</div>
<div class="issue hover-underline">
	${iconHtml}
	<a clicktracking="off" href="${providerUrl}" class="space-left">${providerName} ${providerUrl}</a>
</div>
<br>
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
<div class="section nice-gray section-text">RELATED</div>
${relatedDivs}
<br>
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
				const repo = Utils.getRepoForMarker(marker, options);
				const file = Utils.getFileForMarker(marker, options);
				if (repo) {
					path += `[${repo}] `;
				}
				if (file) {
					path += file;
				}
			}
		}

		const relatedTitle = Utils.cleanForEmail(codemark.title || codemark.text);
		const iconHtml = Utils.renderIcon(codemark.type);
		return `
<div class="related">
	${iconHtml}&nbsp;
	<a clicktracking="off" href="${codemark.permalink}">
		<span class="related-title">${relatedTitle}</span>&nbsp;<span class="nice-gray hover-underline">${path}</span>
	</a>
</div>
`;

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
		const { branchWhenCreated, commitHashWhenCreated } = marker;
		const repo = Utils.getRepoForMarker(marker, options);
		const file = Utils.getFileForMarker(marker, options);
		const branch = branchWhenCreated || '';
		const commitHash = commitHashWhenCreated ? commitHashWhenCreated.slice(0, 7) : '';
		let code = (marker.code || '').trimEnd();

		// get buttons to display
		let buttons = '';
		if ((options.codemark.markerIds || []).length > 1) {
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
}

module.exports = CodemarkRenderer;
