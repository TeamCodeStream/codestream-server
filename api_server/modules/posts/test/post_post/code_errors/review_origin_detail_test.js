'use strict';

const ReviewTest = require('./review_test');

class ReviewOriginDetailTest extends ReviewTest {

	constructor (options) {
		super(options);
		this.expectedOrigin = 'VS Code';
		this.expectedOriginDetail = 'Visual Studio Code - Insiders';		
		this.apiRequestOptions = {
			headers: {
				'X-CS-Plugin-IDE': 'VS Code',
				'X-CS-Plugin-IDE-Detail': 'Visual Studio Code - Insiders'
			}
		};
	}

	get description () {
		return 'post and review origin detail should be set to the plugin given by the request header when creating a post with review info';
	}
}

module.exports = ReviewOriginDetailTest;
