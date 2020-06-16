'use strict';

const PostCodemarkTest = require('./post_codemark_test');

class OriginDetailFromPluginTest extends PostCodemarkTest {

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
		return 'codemark origin detail should be set to the plugin given by the request header';
	}
}

module.exports = OriginDetailFromPluginTest;
