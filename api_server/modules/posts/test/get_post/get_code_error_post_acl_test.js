'use strict';

const GetPostWithCodeErrorTest = require('./get_post_with_code_error_test');

class GetCodeErrorPostAclTest extends GetPostWithCodeErrorTest {

	constructor (options) {
		super(options);
		this.postOptions.creatorIndex = 1;
	}

	get description () {
		return 'should return an error when fetching a post for a code error when i am not a follower';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'	// readAuth
		};
	}
}

module.exports = GetCodeErrorPostAclTest;
