// provides a class to handle rendering a codemark as HTML for email notifications

'use strict';

const EmailUtilities = require('./server_utils/email_utilities');
const Path = require('path');
const Utils = require('./utils');

class CodemarkRenderer {

	/* eslint complexity: 0 */
	render (options) {
		const authorDiv = this.renderAuthorDiv(options);
		const titleDiv = this.renderTitleDiv(options);
		const tagsAssigneesDiv = this.renderTagsAssigneesDiv(options);
		const descriptionDiv = this.renderDescriptionDiv(options);
		const relatedDiv = this.renderRelatedDiv(options);
		const codeBlockDivs = this.renderCodeBlockDivs(options);

		return `
<div class="codemarkWrapper">
	${authorDiv}
	${titleDiv}
	${tagsAssigneesDiv}
	${descriptionDiv}
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
		return `
<div class="authorLine">
	<span class="author">${author}</span>&nbsp;<span class="datetime">${datetime}</span>
</div>
`;
	}

	// render the div for the title
	renderTitleDiv (options) {
		const { codemark, mentionedUserIds, members } = options;
		// display title: the codemark title if there is one, or just the codemark text
		const title = Utils.prepareForEmail(codemark.title || codemark.text, mentionedUserIds, members);
		return `
<div class="title">
	${title}
	<br>
</div>
`;
	}

	// render the div for the tags and assignees, which are displayed side-by-side
	renderTagsAssigneesDiv (options) {
		const { codemark, members } = options;

		// display tags, if any
		let tagsAssigneesHeader = '';
		let tagsAssignees = '';
		if (codemark.tags && codemark.tags.length > 0) {
			tagsAssigneesHeader += 'TAGS';
			tagsAssignees += codemark.tags.join(',');
		}

		// display assignees, if any
		if (
			(codemark.assignees && codemark.assignees.length > 0) ||
			(codemark.externalAssignees && codemark.externalAssignees.length > 0)
		) {
			if (tagsAssigneesHeader) {
				tagsAssigneesHeader += '&nbsp;'.repeat(16);
			}
			tagsAssigneesHeader += 'ASSIGNEES';
			if (tagsAssignees) {
				tagsAssignees += '&nbsp;'.repeat(20 - (codemark.tags || []).length);
			}
			tagsAssignees += this.getAssigneesText(codemark, members);
		}

		if (tagsAssignees) {
			return `
<div class="sectionHeader">${tagsAssigneesHeader}</div>
<div class="tagsAssignees">${tagsAssignees}</div>
`;
		}
		else {
			return '';
		}
	}

	// render the description div, as needed
	renderDescriptionDiv (options) {
		const { codemark, mentionedUserIds, members } = options;
		// there is a description if there is both a title and text, in which case it's the text
		if (codemark.title && codemark.text) {
			const text = Utils.prepareForEmail(codemark.text, mentionedUserIds, members);
			return `
<div class="sectionHeader">DESCRIPTION</div>
<div class="description">${text}</div>
`;
		}
		else {
			return '';
		}
	}

	// render the related codemarks, if any
	renderRelatedDiv (options) {
		const { codemark, relatedCodemarks } = options;
		// list related codemarks, if any
		let relatedDivs = '';
		for (let relatedCodemarkId of codemark.relatedCodemarkIds || []) {
			const relatedCodemark = relatedCodemarks.find(relatedCodemark => relatedCodemark.id === relatedCodemarkId);
			if (relatedCodemark) {
				const relatedTitle = Utils.cleanForEmail(relatedCodemark.title || relatedCodemark.text);
				relatedDivs += `
<div class="related">${relatedTitle}</div>
`;
			}
		}
		if (relatedDivs) {
			return `
<div class="sectionHeader">RELATED</div>
${relatedDivs}
`;
		}
		else {
			return '';
		}
	}

	// render the code block divs, if any
	renderCodeBlockDivs (options) {
		const { codemark, fileStreams, markers } = options;
		// display code blocks
		let codeBlockDivs = '';
		for (let markerId of codemark.markerIds || []) {
			const marker = markers.find(marker => marker.id === markerId);
			if (marker && marker.code) {
				codeBlockDivs += this.renderCodeBlock(marker, fileStreams);
			}
		}
		return codeBlockDivs;
	}

	// render a single code block
	renderCodeBlock (marker, fileStreams) {
		const fileStream = marker.fileStreamId && fileStreams.find(stream => stream.id === marker.fileStreamId);
		let file = (fileStream && fileStream.file) || marker.file || '';
		let code = marker.code;

		if (file) {
			// do syntax highlighting for the code, based on the file extension
			let extension = Path.extname(file).toLowerCase();
			if (extension.startsWith('.')) {
				extension = extension.substring(1);
			}
			code = Utils.highlightCode(code, extension);

			// try to prevent the email client from linkifying this url
			file = file
				.replace(/\//g, '<span>/</span>')
				.replace(/\./g, '<span>.</span>');
		}

		return `
<div class="codeBlockHeader">${file}</div>
<div class="codeBlock">${code}</div>
`;
	}

	// get the assignees to an issue displayed as usernames
	getAssigneesText (codemark, members) {
		if (!members) {
			members = [];
		}
		const users = [];
		(codemark.assignees || []).forEach(userId => {
			const user = members.find(user => user.id === userId);
			if (user) {
				users.push(user.fullName);
			}
		});
		(codemark.externalAssignees || []).forEach(assignee => {
			if (
				typeof assignee === 'object' &&
				assignee.displayName && 
				typeof assignee.displayName === 'string'
			) {
				users.push(assignee.displayName);
			}
		});
		return users.join(', ');
	}
}

module.exports = CodemarkRenderer;
