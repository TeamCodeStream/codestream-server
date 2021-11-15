'use strict';

const GetReplyToCodeErrorTest = require('./get_reply_to_code_error_test');

class GetCodeErrorReplyAclTest extends GetReplyToCodeErrorTest {

	constructor (options) {
		super(options);
		this.postOptions.creatorIndex = 1;
		this.teamOptions.members = [];
		this.replyFromUser = 1;
	}

	get description () {
		return 'should return an error when fetching a reply to a code error from a team the user is not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'	// readAuth
		};
	}
}

module.exports = GetCodeErrorReplyAclTest;
