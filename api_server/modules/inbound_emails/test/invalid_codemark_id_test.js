'use strict';

const CodemarkReplyTest = require('./codemark_reply_test');

class InvalidCodemarkIdTest extends CodemarkReplyTest {

	get description () {
		return 'should return an error when trying to send an inbound email request with a to address that has an invalid codemark ID';
	}

	getExpectedError () {
		return {
			code: 'INBE-1004',
		};
	}

	// make the data to be used in the request that triggers the message
	makePostData (callback) {
		super.makePostData(() => {
			// inject a bogus codemark ID
			const index = this.data.to[0].address.indexOf('.');
			this.data.to[0].address = 'abcdefg' + this.data.to[0].address.slice(index);
			this.data.to.splice(1);
			callback();
		});
	}
}

module.exports = InvalidCodemarkIdTest;
