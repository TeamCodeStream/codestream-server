'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const UUID = require('uuid').v4;

class InviteInfoDeprecatedTest extends CodeStreamAPITest {

	get description () {
		return 'should return an error indicating the functionality is deprecated when requesting info relevant to an invite code';
	}

	get method () {
		return 'get';
	}

	get path () { 
		return '/no-auth/invite-info?code=' + UUID();
	}

	getExpectedError() {
		return {
			code: 'RAPI-1016',
			reason: 'invite codes are deprecated'
		};
	}
}

module.exports = InviteInfoDeprecatedTest;