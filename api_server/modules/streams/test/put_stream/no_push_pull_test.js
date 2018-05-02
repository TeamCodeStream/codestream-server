'use strict';

const AddUsersTest = require('./add_users_test');

class NoPushPullTest extends AddUsersTest {

	get description () {
		return 'should return an error when trying to update a stream with a $push and a $pull to the memberIds array';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005'
		};
	}

	// before the test runs...
	makeStreamData (callback) {
		super.makeStreamData(() => {
			this.data.$pull = { memberIds: this.data.$addToSet.memberIds[0] };
			callback();
		});
	}
}

module.exports = NoPushPullTest;
