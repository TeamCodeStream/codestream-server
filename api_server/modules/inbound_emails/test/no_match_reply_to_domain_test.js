'use strict';

const InboundEmailTest = require('./inbound_email_test');

class NoMatchReplyToDomainTest extends InboundEmailTest {

	get description () {
		return 'should return an error when trying to send an inbound email request with a to address that does not match our reply domain';
	}

	getExpectedError () {
		return {
			code: 'INBE-1004',
		};
	}

	// make the data to be used in the request that triggers the message
	makePostData (callback) {
		super.makePostData(() => {
			// change the first to address, and eliminate all others
			this.data.to[0].address = this.userFactory.randomEmail();
			this.data.to.splice(1);
			callback();
		});
	}
}

module.exports = NoMatchReplyToDomainTest;
