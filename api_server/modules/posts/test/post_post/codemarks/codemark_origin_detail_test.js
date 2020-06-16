'use strict';

const CodemarkTest = require('./codemark_test');

class CodemarkOriginDetailTest extends CodemarkTest {

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
		return 'post and codemark origin detail should be set to the plugin given by the request header when creating a post with codemark info';
	}
}

module.exports = CodemarkOriginDetailTest;
