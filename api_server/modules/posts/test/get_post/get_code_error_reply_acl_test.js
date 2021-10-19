'use strict';

const GetReplyToCodeErrorTest = require('./get_reply_to_code_error_test');

class GetCodeErrorReplyAclTest extends GetReplyToCodeErrorTest {

	constructor (options) {
		super(options);
		this.postOptions.creatorIndex = 1;
		this.replyFromUser = 1;
	}

	get description () {
		return 'should return an error when fetching a reply to a code error when i am not a follower';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'	// readAuth
		};
	}
}

module.exports = GetCodeErrorReplyAclTest;
