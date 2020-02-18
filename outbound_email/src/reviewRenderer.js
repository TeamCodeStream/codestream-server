// provides a class to handle rendering a review as HTML for email notifications

'use strict';

const Utils = require('./utils');

class ReviewRenderer {

	/* eslint complexity: 0 */
	render (options) {
	
		const authorDiv = this.renderAuthorDiv(options);
		const titleDiv = this.renderTitleDiv(options);
		const tagsReviewersTable = this.renderTagsReviewersTable(options);
		const descriptionDiv = this.renderDescriptionDiv(options);
		const codeBlockDivs = this.renderCodeBlockDivs(options);

		return `
<div class="inner-content new-content">
	${authorDiv}
	${titleDiv}
	${tagsReviewersTable}
	${descriptionDiv}
	${codeBlockDivs}
</div>
`;
	}

	// render the author line
	renderAuthorDiv (options) {
		const { review, creator, timeZone } = options;
		const authorOptions = {
			time: review.createdAt,
			creator,
			timeZone,
			datetimeField: 'datetime'
		};
		return Utils.renderAuthorDiv(authorOptions);
	}

	// render the div for the title
	renderTitleDiv (options) {
		const { review } = options;
		return Utils.renderTitleDiv(review.title, options);
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

	// render the code block divs for the review, if any
	renderCodeBlockDivs (options) {
		return Utils.renderCodeBlockDivs({
			...options,
			markerIds: options.review.markerIds
		});
	}
}

module.exports = ReviewRenderer;
