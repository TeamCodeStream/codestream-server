'use strict';

var TeamsPostTest = require('./teams_post_test');

class IncorrectSecretTest extends TeamsPostTest {

	get description () {
		return 'should return an error when trying to send a teams post request with an incorrect secret';
	}

	getExpectedError () {
		return {
			code: 'INTG-1001',
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
