'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class WebTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 0;
		delete this.teamOptions.creatorIndex;
		this.ignoreTokenOnRequest = true;
		this.apiRequestOptions = {
			noJsonInResponse: true
		};
	}
}

module.exports = WebTest;
