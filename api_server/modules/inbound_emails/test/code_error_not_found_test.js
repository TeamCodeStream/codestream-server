'use strict';

const CodeErrorReplyTest = require('./code_error_reply_test');
const ObjectID = require('mongodb').ObjectID;

class CodeErrorNotFoundTest extends CodeErrorReplyTest {

	get description () {
		return 'should return an error when trying to send an inbound email request with a to address that has a code error ID for a code error that does not exist';
	}

	getExpectedError () {
		return {
			code: 'INBE-1008',
		};
	}

	// make the data to be used in the request that triggers the message
	makePostData (callback) {
		super.makePostData(() => {
			// inject a valid but non-existent code error ID
			const index = this.data.to[0].address.indexOf('.');
			const fakeCodeErrorId = ObjectID();
			this.data.to[0].address = fakeCodeErrorId + this.data.to[0].address.slice(index);
			this.data.to.splice(1);
			callback();
		});
	}
}

module.exports = CodeErrorNotFoundTest;
