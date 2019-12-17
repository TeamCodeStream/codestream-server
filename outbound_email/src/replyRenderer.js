// provides a class to handle rendering a single post as HTML for email notifications

'use strict';

const Utils = require('./utils');

class ReplyRenderer {

	/* eslint complexity: 0 */
	render (options) {

		options.clickUrl = Utils.getIDEUrl(options);
		options.extension = Utils.getExtension(options);

		const codemarkAuthorDiv = this.renderCodemarkAuthorDiv(options);
		const titleDiv = this.renderTitleDiv(options);
		const iconsDiv = this.renderIconsDiv(options);
		const authorDiv = this.renderAuthorDiv(options);
		const textDiv = this.renderTextDiv(options);

		return `
<div>
	${codemarkAuthorDiv}
	${titleDiv}
	${iconsDiv}
	<div class="reply">
		${authorDiv}
		${textDiv}
	</div>
</div>
`;
	}

	// render the author line with timestamp for the codemark creator
	renderCodemarkAuthorDiv (options) {
		const { codemark, codemarkCreator, timeZone } = options;
		const authorOptions = {
			time: codemark.createdAt,
			creator: codemarkCreator,
			timeZone,
			datetimeField: 'codemarkDatetime'
		};
		return Utils.renderAuthorDiv(authorOptions);
	}

	// render the div for the title of the codemark
	renderTitleDiv (options) {
		const { codemark } = options;
		// display title: the codemark title if there is one, or just the codemark text
		const title = Utils.prepareForEmail(codemark.title || codemark.text, options);
		return `
<div class="title">
	${title}
	<br>
</div>
`;
	}

	// render the associated icons
	renderIconsDiv (options) {
		const watching = this.renderWatching(options);
		const tagsAssignees = this.renderTagsAndAssignees(options);
		const linkedIssue = this.renderLinkedIssue(options);
		const description = this.renderDescription(options);
		const codeBlocks = this.renderCodeBlocks(options);
		const related = this.renderRelatedCodemarks(options);
		const replies = this.renderReplies(options);
		const html = [
			watching,
			tagsAssignees,
			linkedIssue,
			description,
			codeBlocks,
			related,
			replies
		].join('');
		return `<div class="reply-icons">${html}</div>`;
	}

	// render the watching icon
	renderWatching (options) {
		return `
<span>
	<a clicktracking="off" href="${options.clickUrl}">
		${Utils.renderIcon('eye')}
	</a>
</span>
`;
	}

	// render tags and assignees
	renderTagsAndAssignees (options) {
		const tags = Utils.renderTags(options);
		const assignees = this.renderAssignees(options);
		return `
<a class="reply-tags" clicktracking="off" href="${options.clickUrl}">${tags}${assignees}</a>
`;
	}

	// render the headshots or initials of assignees
	renderAssignees (options) {
		const { codemark, members } = options;

		let assignees = [];
		(codemark.assignees || []).forEach(assigneeId => {
			const user = members.find(member => member.id === assigneeId);
			if (user) {
				assignees.push(user);
			}
		});
		assignees = [...assignees, ...(codemark.externalAssignees || [])];

		return assignees.map(assignee => {
			return Utils.renderUserHeadshot(assignee);
		}).join('');
	}

	// render the author line with timestamp
	renderAuthorDiv (options) {
		const { post, creator, timeZone } = options;
		const authorOptions = {
			time: post.createdAt,
			creator,
			timeZone,
			datetimeField: 'datetime'
		};
		return Utils.renderAuthorDiv(authorOptions);
	}

	// render a linked issue icon as needed
	renderLinkedIssue (options) {
		const { codemark } = options;
		if (!codemark.externalProvider) { return ''; }
		const providerUrl = codemark.externalProviderUrl;
		const iconHtml = Utils.renderIcon(codemark.externalProvider);
		return `
<span class="reply-icon">
	<a clicktracking="off" href="${providerUrl}">${iconHtml}</a>
</span>
`;
	}

	// render the description icon
	renderDescription (options) {
		return `
<span class="reply-icon">
	<a clicktracking="off" href="${options.clickUrl}">
		${Utils.renderIcon('description')}
	</a>
</span>
`;
	}

	// render the icon for code blocks, and their number
	renderCodeBlocks (options) {
		const { codemark, clickUrl } = options;
		const numMarkers = (codemark.markerIds || []).length;
		if (numMarkers > 1) {
			const iconHtml = Utils.renderIcon('code');
			return `
<span class="reply-icon">
	<a clicktracking="off" href="${clickUrl}">
		${iconHtml}
		<span class="icon-spaced nice-gray">${numMarkers}</span>
	</a>
</span>
`;
		}
		else {
			return '';
		}
	}

	// render the icon for related codemarks, and their number
	renderRelatedCodemarks (options) {
		const { codemark, clickUrl } = options;
		const numRelated = (codemark.relatedCodemarkIds || []).length;
		if (numRelated) {
			const iconHtml = Utils.renderIcon('codestream');
			return `
<span class="reply-icon">
	<a clicktracking="off" href="${clickUrl}">
		${iconHtml}
		<span class="icon-spaced nice-gray">${numRelated}</span>
	</a>
</span>
`;
		}
		else {
			return '';
		}
	}

	// render the icon for codemark replies, if any, and their number
	renderReplies (options) {
		const { codemark, clickUrl } = options;
		const numReplies = codemark.numReplies || 0;
		if (numReplies) {
			const iconHtml = Utils.renderIcon('comment');
			return `
<span class="reply-icon">
	<a clicktracking="off" href="${clickUrl}">
		${iconHtml}
		<span class="icon-spaced nice-gray">${numReplies}</span>
	</a>
</span>
`;
		}
		else {
			return '';
		}
	}

	// render the div for the post text
	renderTextDiv (options) {
		const { post } = options;
		const text = Utils.prepareForEmail(post.text, options);
		return `
<div>
	${text}
	<br>
</div>
`;
	}
}

module.exports = ReplyRenderer;
