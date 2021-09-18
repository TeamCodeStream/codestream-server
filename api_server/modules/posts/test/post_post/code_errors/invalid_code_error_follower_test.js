'use strict';

const AddCodeErrorFollowersTest = require('./add_code_error_followers_test');
const ObjectID = require('mongodb').ObjectID;

class InvalidCodeErrorFollowerTest extends AddCodeErrorFollowersTest {

	get description () {
		return 'should return an error if an unknown user is added as the follower of a code error created with a post';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'followers must contain only users on the team'
		};
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.codeError.followerIds.push(ObjectID());
			callback();
		});
	}
}

module.exports = InvalidCodeErrorFollowerTest;
