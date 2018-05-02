'use strict';

const AddUserTest = require('./add_user_test');

class MemberIdsNotArrayTest extends AddUserTest {

	get description () {
		return 'should return an error when trying to update a stream with a memberIds attribute that is not a string or array';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005'
		};
	}

	// before the test runs...
	makeStreamData (callback) {
		// substitute bogus memberIds value
		super.makeStreamData(() => {
			this.data.$addToSet.memberIds = 1;
			callback();
		});
	}
}

module.exports = MemberIdsNotArrayTest;
