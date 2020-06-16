'use strict';

const InboundEmailTest = require('./inbound_email_test');

class NoFromAddressTest extends InboundEmailTest {

	get description () {
		return 'should return an error when trying to send an inbound email request without providing an address for the from object';
	}

	getExpectedError () {
		return {
			code: 'INBE-1002',
		};
	}

	// make the data to be used in the request that triggers the message
	makePostData (callback) {
		super.makePostData(() => {
			delete this.data.from.address;	// remove the from address
			callback();
		});
	}
}

module.exports = NoFromAddressTest;
