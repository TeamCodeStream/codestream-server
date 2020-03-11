// provides a class to handle rendering a codemark as HTML for email notifications

'use strict';

const Utils = require('./utils');
const RendererBase = require('./rendererBase');

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

class CodemarkRenderer extends RendererBase {

	constructor() {
		super();
	}

	/* eslint complexity: 0 */
	render (options) {
		const { codemark, suppressNewContent, includeReviewSection, includeActivity } = options;
		
		let titleAuthorDiv = '';
		if (codemark.type === 'issue') {
			titleAuthorDiv = this.renderTitleAuthorDiv(options);			
		}
		else {
			titleAuthorDiv = this.renderAuthorDiv(options) + this.renderTitleDiv(options);
		}
		const visibleToDiv = this.renderVisibleToDiv(options);
		const tagsAssigneesTable = this.renderTagsAssigneesTable(options);
		const descriptionDiv = this.renderDescriptionDiv(options);
		let parentReviewDiv = '';
		if (includeReviewSection) {
			parentReviewDiv = this.renderParentReviewDiv(options);		 
		}
		let activityDiv = '';
		if (includeActivity) {
			activityDiv = this.renderActivityDiv(options);
		}
		const linkedIssuesDiv = this.renderLinkedIssuesDiv(options);
		const relatedDiv = this.renderRelatedDiv(options);
		const codeBlockDivs = this.renderCodeBlockDivs(options);
		let cssClasses =' inner-content';
		if (!suppressNewContent) {
			cssClasses += ' new-content';
		}
		return `
<div class="inner-content${cssClasses}">
	${titleAuthorDiv}
	${visibleToDiv}
	${tagsAssigneesTable}
	${descriptionDiv}
	${parentReviewDiv}
	${linkedIssuesDiv}
	${relatedDiv}
	${codeBlockDivs}
	${activityDiv}
</div>
`;
	}

	renderCollapsed (options) {
		const { includeActivity } = options;
		
		const codemarkAuthorDiv = this.renderCodemarkAuthorDiv(options);
		const titleDiv = this.renderTitleDiv(options);		
		const codeBlockDivs = this.renderCodeBlockDivs(options);
		let activityDiv = '';
		if (includeActivity) {
			activityDiv = this.renderActivityDiv(options);
		}

		return `
		<div class="inner-content">
			${codemarkAuthorDiv}
			${titleDiv}
			${codeBlockDivs}
			${activityDiv}
		</div>
		`;
	}

	renderTitleAuthorDiv (options) {
		const { codemark, creator, timeZone } = options;
		const authorOptions = {
			time: codemark.createdAt,
			creator,
			timeZone,
			datetimeField: 'datetime',
			title: codemark.title,
			icon: 'issue',
		};
		return Utils.renderTitleAuthorDiv(authorOptions);
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
		const title = codemark.type === 'issue' ? codemark.title : codemark.text;
		return Utils.renderTitleDiv(title, options);
	}

	renderReplies (options) {
		const { codemark } = options;
		return super.renderReplies(codemark, options);
	}

	// render the div for whom the codemark is visible, if a private codemark
	renderVisibleToDiv (options) {
		const { stream } = options;
		if (stream.privacy === 'public') {
			return '';
		}

		let usernames = this.getVisibleTo(options);
		return Utils.renderSection(`
<div class="nice-gray section-text">VISIBLE TO</div>
<div>${usernames}</div>
`);
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
		return Utils.renderTagsAssigneesTable({
			assignees: codemark.assignees,
			externalAssignees: codemark.externalAssignees,
			tags: codemark.tags,
			header: 'ASSIGNEES',
			members,
			team: options.team
		});
	}

	// render the description div, as needed
	renderDescriptionDiv (options) {
		const { codemark } = options;
		if (codemark.type !== 'issue') return '';
		
		return Utils.renderDescriptionDiv(codemark.text, options);
	}

	// render any linked issues
	renderLinkedIssuesDiv (options) {
		const { codemark } = options;
		if (!codemark.externalProvider) { return ''; }
		const providerName = PROVIDER_DISPLAY_NAMES[codemark.externalProvider] || codemark.externalProvider;
		const providerUrl = codemark.externalProviderUrl;
		let iconHtml = Utils.renderIcon(codemark.externalProvider);
		return Utils.renderSection(`
		<div class="nice-gray section-text">LINKED ISSUES</div>
<div class="issue hover-underline">
	${iconHtml}
	<a clicktracking="off" href="${providerUrl}" class="space-left">${providerName} ${providerUrl}</a>
</div>`);
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
			return Utils.renderSection(`<div class="nice-gray section-text">RELATED</div>${relatedDivs}`);
		}
		else {
			return '';
		}
	}

	// render the parent review, if any
	renderParentReviewDiv (options) {		
		const { review } = options;
		if (review) {
			return Utils.renderParentReviewDiv(options);
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

	// render the code block divs for the codemark, if any
	renderCodeBlockDivs (options) {
		return Utils.renderCodeBlockDivs({
			...options,
			markerIds: options.codemark.markerIds
		});
	}
}

module.exports = CodemarkRenderer;
