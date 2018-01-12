'use strict';

var InboundEmailTest = require('./inbound_email_test');

class InvalidStreamIdTest extends InboundEmailTest {

	get description () {
		return 'should return an error when trying to send an inbound email request with a to address that has an invalid stream ID';
	}

	getExpectedError () {
		return {
			code: 'INBE-1004',
		};
	}

	// make the data to be used in the request that triggers the message
	makePostData (callback) {
		super.makePostData(() => {
			// inject a bogus stream ID
			let index = this.data.to[0].address.indexOf('.');
			this.data.to[0].address = 'abcdefg' + this.data.to[0].address.slice(index);
			this.data.to.splice(1);
			callback();
		});
	}
}

module.exports = InvalidStreamIdTest;
