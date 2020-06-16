// provides a class to handle rendering a review as HTML for email notifications

'use strict';

const Utils = require('./utils');
const RendererBase = require('./rendererBase');

class ReviewRenderer extends RendererBase {
	
	constructor() {
		super();
	}

	/* eslint complexity: 0 */
	// renders a large version of the review
	render (options) {
		return `
<div class="inner-content new-content">
	${this.renderTitleAuthorDiv(options)}
	${this.renderTagsReviewersTable(options)}
	${this.renderDescriptionDiv(options)}
	${this.renderStatus(options)}
	${this.renderReposAndFiles(options)}
</div>
`;
	}

	// renders a smaller (collapsed) version of the review
	renderCollapsed (options) {
		const codemarkAuthorDiv = this.renderReviewAuthorDiv(options);
		const titleDiv = this.renderTitleDiv(options);
		const activityDiv = this.renderActivityDiv(options);
		return `
		<div class="inner-content">
			${codemarkAuthorDiv}
			${titleDiv}
			${activityDiv}
		</div>`;
	}

	renderReplies (options) {
		const { review } = options;
		return super.renderReplies(review, options);
	}

	renderParentPost (options) {
		const { parentPost, creator, timeZone } = options;
		const authorOptions = {
			time: parentPost.createdAt,
			creator,
			timeZone,
			datetimeField: 'datetime'
		};
		const authorDiv = Utils.renderAuthorDiv(authorOptions);
		const text = Utils.prepareForEmail(parentPost.text, options);
		const textDiv = `<div><span class="ensure-white">${text}</span></div>`;
		return authorDiv + textDiv;
	}

	// render the div for the title of the review
	renderTitleDiv (options) {
		const { review } = options;
		return Utils.renderTitleDiv(review.title, options);
	}

	// render the author line
	renderTitleAuthorDiv (options) {
		const { review, creator, timeZone } = options;
		const authorOptions = {
			time: review.createdAt,
			creator,
			timeZone,
			datetimeField: 'datetime',
			title: review.title,
			icon: 'review',
		};
		return Utils.renderTitleAuthorDiv(authorOptions);
	}

	// render the table for the tags and reviewers, which are displayed side-by-side
	renderTagsReviewersTable (options) {
		const { review, members } = options;
		return Utils.renderTagsAssigneesTable({
			assignees: review.reviewers,
			tags: review.tags,
			header: 'REVIEWERS',
			members,
			team: options.team
		});
	}

	// render the description div, as needed
	renderDescriptionDiv (options) {
		const { review } = options;
		return Utils.renderDescriptionDiv(review.text, options);
	}

	// render the status for the review
	renderStatus (options) {
		return Utils.renderReviewStatus(options);
	}

	// render the list of repos and associated changed files
	renderReposAndFiles (options) {
		return Utils.renderReviewReposAndFiles(options);
	}
}

module.exports = ReviewRenderer;
