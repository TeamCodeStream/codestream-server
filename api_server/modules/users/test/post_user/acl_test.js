'use strict';

const PostUserTest = require('./post_user_test');

class ACLTest extends PostUserTest {

	constructor (options) {
		super(options);
		this.dontIncludeCurrentUser = true;
	}

	get description () {
		return 'should return an error when trying to create a user on a team i\'m not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011'
		};
	}
}

module.exports = ACLTest;
