'use strict';

const PostCodemarkTest = require('./post_codemark_test');

class OriginFromPluginTest extends PostCodemarkTest {

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
		return 'codemark origin should be set to the plugin given by the request header';
	}
}

module.exports = OriginFromPluginTest;
