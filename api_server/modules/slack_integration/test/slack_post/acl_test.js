'use strict';

var SlackPostTest = require('./slack_post_test');

class ACLTest extends SlackPostTest {

	get description () {
		return 'should return an error when trying to send a slack post request without providing the secret';
	}

	getExpectedError () {
		return {
			code: 'SLIN-1001',
		};
	}

	// make the data to be used in the request that triggers the message
	makePostData (callback) {
		super.makePostData(() => {
			delete this.data.secret;	// remove the secret
			callback();
		});
	}
}

module.exports = ACLTest;
