'use strict';

var InboundEmailTest = require('./inbound_email_test');

class FromAddressNotFoundTest extends InboundEmailTest {

	get description () {
		return 'should return an error when trying to send an inbound email request with a from address that does not exist';
	}

	getExpectedError () {
		return {
			code: 'INBE-1003',
		};
	}

	// make the data to be used in the request that triggers the message
	makePostData (callback) {
		super.makePostData(() => {
			this.data.from.address = this.userFactory.randomEmail(); // change the from address
			callback();
		});
	}
}

module.exports = FromAddressNotFoundTest;
