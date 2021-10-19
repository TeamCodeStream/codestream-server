'use strict';

const GetUsersTest = require('./get_users_test');

class ACLCodeErrorTest extends GetUsersTest {

	constructor (options) {
		super(options);
		Object.assign(this.postOptions, {
			creatorIndex: 1,
			numPosts: 1,
			wantCodeError: true
		});
	}

	get description () {
		return 'should return an error when trying to fetch users for a code error i\'m not following';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009',
			reason: 'user is not a follower of this object'
		};
	}

	setPath (callback) {
		this.path = `/users?codeErrorId=${this.postData[0].codeError.id}`;
		callback();
	}
}

module.exports = ACLCodeErrorTest;
