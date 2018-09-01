'use strict';

const PostPostTest = require('./post_post_test');

class OriginFromPluginTest extends PostPostTest {

	constructor (options) {
		super(options);
		this.testOptions = {
			expectedOrigin: 'VS Code'
		};
		this.apiRequestOptions = {
			headers: {
				'X-CS-Plugin-IDE': 'VS Code'
			}
		};
	}

	get description () {
		return 'post origin should be set to the plugin given by the request header';
	}
}

module.exports = OriginFromPluginTest;
