'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');

class EnableServiceGatewayAuthTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 0;
		delete this.teamOptions.creatorIndex;
	}

	get description () {
		return 'should prevent setting of Service Gateway header acceptance if subscription cheat is not provided';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001'
		};
	}

	get method () {
		return 'post';
	}

	get path () {
		return '/no-auth/enable-sg';
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data = {
				enable: true
				// notably absent: the subscription cheat
			};
			callback();
		});
	}
}

module.exports = EnableServiceGatewayAuthTest;
