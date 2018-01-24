'use strict';

var PutUserTest = require('./put_user_test');

class ACLTest extends PutUserTest {

	get description () {
		return `should return an error when trying to update a different user`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'only the user can update their own attributes'
		};
	}

    // before the test runs...
    before (callback) {
        super.before(error => {
            if (error) { return callback(error); }
            // replace the current user's token with the other user's token
            this.token = this.otherUserData.accessToken;
            callback();
        });
    }
}

module.exports = ACLTest;
