'use strict';

var SlackPostTest = require('./slack_post_test');

class IncorrectSecretTest extends SlackPostTest {

	get description () {
		return 'should return an error when trying to send a slack post request with an incorrect secret';
	}

	getExpectedError () {
		return {
			code: 'SLIN-1001',
		};
	}

	// make the data to be used in the request that triggers the message
	makePostData (callback) {
		super.makePostData(() => {
			this.data.secret += 'x';	// change the secret
			callback();
		});
	}
}

module.exports = IncorrectSecretTest;
