'use strict';

var InboundEmailTest = require('./inbound_email_test');

class ACLTest extends InboundEmailTest {

	get description () {
		return 'should return an error when trying to send an inbound email request without providing the secret';
	}

	getExpectedError () {
		return {
			code: 'INBE-1001',
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
