'use strict';

var InboundEmailTest = require('./inbound_email_test');

class InvalidTeamIdTest extends InboundEmailTest {

	get description () {
		return 'should return an error when trying to send an inbound email request with a to address that has an invalid team ID';
	}

	getExpectedError () {
		return {
			code: 'INBE-1004',
		};
	}

	// make the data to be used in the request that triggers the message
	makePostData (callback) {
		super.makePostData(() => {
			// inject a bogus team ID
			let toAddress = this.data.to[0].address;
			let atIndex = toAddress.indexOf('@');
			let dotIndex = toAddress.indexOf('.');
			this.data.to[0].address = toAddress.slice(0, dotIndex + 1) + 'abcdefg' +
				toAddress.slice(atIndex);
			this.data.to.splice(1);
			callback();
		});
	}
}

module.exports = InvalidTeamIdTest;
