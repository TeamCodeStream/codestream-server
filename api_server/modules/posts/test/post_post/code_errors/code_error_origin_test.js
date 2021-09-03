'use strict';

const CodeErrorTest = require('./code_error_test');

class CodeErrorOriginTest extends CodeErrorTest {

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
		return 'post and code error origin should be set to the plugin given by the request header when creating a post with code error info';
	}
}

module.exports = CodeErrorOriginTest;
