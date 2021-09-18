'use strict';

const CodeErrorTest = require('./code_error_test');

class CodeErrorOriginDetailTest extends CodeErrorTest {

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
		return 'post and code error origin detail should be set to the plugin given by the request header when creating a post with code error info';
	}
}

module.exports = CodeErrorOriginDetailTest;
