'use strict';

const UnreadTest = require('./unread_test');

class UnreadACLTest extends UnreadTest {

	constructor (options) {
		super(options);
		this.teamOptions.members = [];
	}

	get description () {
		return 'should return error when user attempts to mark a post unread when that user is not a member of the stream to which the post belongs';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'
		};
	}

}

module.exports = UnreadACLTest;
