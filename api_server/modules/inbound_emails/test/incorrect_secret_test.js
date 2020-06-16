'use strict';

const InboundEmailTest = require('./inbound_email_test');

class IncorrectSecretTest extends InboundEmailTest {

	get description () {
		return 'should return an error when trying to send an inbound email request with an incorrect secret';
	}

	getExpectedError () {
		return {
			code: 'INBE-1001',
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
