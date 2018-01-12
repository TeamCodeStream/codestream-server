'use strict';

var InboundEmailTest = require('./inbound_email_test');

class InvalidEmailTest extends InboundEmailTest {

	get description () {
		return 'should return an error when trying to send an inbound email request with an invalid to address';
	}

	getExpectedError () {
		return {
			code: 'INBE-1004',
		};
	}

	// make the data to be used in the request that triggers the message
	makePostData (callback) {
		super.makePostData(() => {
			// change the first to address by adding another email part, and eliminate all others
			this.data.to[0].address = 'abc@' + this.data.to[0].address;
			this.data.to.splice(1);
			callback();
		});
	}
}

module.exports = InvalidEmailTest;
