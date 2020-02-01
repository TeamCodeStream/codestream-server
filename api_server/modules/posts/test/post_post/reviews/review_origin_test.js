'use strict';

const ReviewTest = require('./review_test');

class ReviewOriginTest extends ReviewTest {

	constructor (options) {
		super(options);
		this.expectedOrigin = 'VS Code';
		this.apiRequestOptions = {
			headers: {
				'X-CS-Plugin-IDE': 'VS Code'
			}
		};
	}

	get description () {
		return 'post and review origin should be set to the plugin given by the request header when creating a post with review info';
	}
}

module.exports = ReviewOriginTest;
