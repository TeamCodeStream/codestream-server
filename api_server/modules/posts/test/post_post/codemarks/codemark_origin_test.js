'use strict';

const CodemarkTest = require('./codemark_test');

class CodemarkOriginTest extends CodemarkTest {

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
		return 'post and codemark origin should be set to the plugin given by the request header when creating a post with codemark info';
	}
}

module.exports = CodemarkOriginTest;
