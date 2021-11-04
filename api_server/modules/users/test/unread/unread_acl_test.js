'use strict';

const UnreadTest = require('./unread_test');

class UnreadACLTest extends UnreadTest {

	constructor (options) {
		super(options);
		this.skipMarkRead = true;
		this.teamOptions.members = [];
	}

	get description () {
		return 'should return error when user attempts to mark a post unread when that user is not a member of the team that owns the post';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'
		};
	}

}

module.exports = UnreadACLTest;
