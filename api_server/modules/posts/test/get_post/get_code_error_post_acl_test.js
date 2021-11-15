'use strict';

const GetPostWithCodeErrorTest = require('./get_post_with_code_error_test');

class GetCodeErrorPostAclTest extends GetPostWithCodeErrorTest {

	constructor (options) {
		super(options);
		this.postOptions.creatorIndex = 1;
		this.teamOptions.members = [];
	}

	get description () {
		return 'should return an error when fetching a post for a code error from a team the user is not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'	// readAuth
		};
	}
}

module.exports = GetCodeErrorPostAclTest;
