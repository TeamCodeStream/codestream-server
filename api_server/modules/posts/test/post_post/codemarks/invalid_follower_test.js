'use strict';

const AddFollowersTest = require('./add_followers_test');
const ObjectId = require('mongodb').ObjectId;

class InvalidFollowerTest extends AddFollowersTest {

	get description () {
		return 'should return an error if an unknown user is added as the follower of a codemark created with a post';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'followers must contain only users on the team'
		};
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.codemark.followerIds.push(ObjectId());
			callback();
		});
	}
}

module.exports = InvalidFollowerTest;
