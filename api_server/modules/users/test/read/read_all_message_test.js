'use strict';

const ReadMessageTest = require('./read_message_test');
const ReadAllTest = require('./read_all_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class ReadAllMessageTest extends ReadMessageTest {

	get description () {
		return 'the user should receive a message on their me-channel when they indicate they have read all messages in all streams';
	}

	// trigger the api request that generates the message
	generateMessage (callback) {
		BoundAsync.series(this, [
			ReadAllTest.prototype.setExpectedData.bind(this),
			this.markReadAll
		], callback);
	}

	markReadAll (callback) {
		this.message = this.expectedData;
		// do the read/all request
		this.doApiRequest(
			{
				method: 'put',
				path: '/read/all',
				token: this.token
			},
			callback
		);
	}
}

module.exports = ReadAllMessageTest;
