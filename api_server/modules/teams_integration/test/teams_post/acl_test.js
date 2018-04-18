'use strict';

var TeamsPostTest = require('./teams_post_test');

class ACLTest extends TeamsPostTest {

	get description () {
		return 'should return an error when trying to send a teams post request without providing the secret';
	}

	getExpectedError () {
		return {
			code: 'INTG-1001',
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
