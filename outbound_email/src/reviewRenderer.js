// provides a class to handle rendering a review as HTML for email notifications

'use strict';

const Utils = require('./utils');

class ReviewRenderer {

	/* eslint complexity: 0 */
	render (options) {
	
		const titleAuthorDiv = this.renderTitleAuthorDiv(options);
		const tagsReviewersTable = this.renderTagsReviewersTable(options);
		const descriptionDiv = this.renderDescriptionDiv(options);
		const status = this.renderStatus(options);
		const repoAndFiles = this.renderReposAndFiles(options);

		return `
<div class="inner-content new-content">
	${titleAuthorDiv}
	${tagsReviewersTable}
	${descriptionDiv}
	${status}
	${repoAndFiles}
</div>
`;
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
		return Utils.renderAuthorTitleDiv(authorOptions);
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
