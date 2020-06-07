'use strict';

const NewUsersOnTheFlyTest = require('./new_users_on_the_fly_test');

class NewUsersMustBeInTeamStreamTest extends NewUsersOnTheFlyTest {

	constructor (options) {
		super(options);
		this.streamOptions.isTeamStream = false;
	}

	get description () {
		return `should return an error if a codemark is being created with a post, and new users are being added, in a ${this.streamType} stream that is not a team stream`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			reason: 'cannot add users to a stream that is not a team stream'
		};
	}
}

module.exports = NewUsersMustBeInTeamStreamTest;
