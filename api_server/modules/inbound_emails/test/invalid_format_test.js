'use strict';

const InboundEmailTest = require('./inbound_email_test');

class InvalidFormatTest extends InboundEmailTest {

	get description () {
		return 'should return an error when trying to send an inbound email request with a to address in an invalid format';
	}

	getExpectedError () {
		return {
			code: 'INBE-1004',
		};
	}

	// make the data to be used in the request that triggers the message
	makePostData (callback) {
		super.makePostData(() => {
			// change the first to address by eliminating the dot separation,
			// and eliminate all other to-addresses
			const index = this.data.to[0].address.indexOf('.');
			this.data.to[0].address = this.data.to[0].address.slice(0, index) +
				this.data.to[0].address.slice(index + 1);
			this.data.to.splice(1);
			callback();
		});
	}
}

module.exports = InvalidFormatTest;
