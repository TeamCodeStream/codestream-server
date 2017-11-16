'use strict';

var ReadMessageTest = require('./read_message_test');

class ReadAllMessageTest extends ReadMessageTest {

	get description () {
		return 'the user should receive a message on their me-channel when they indicate they have read all messages in all streams';
	}

	generateMessage (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/read/all',
				token: this.token
			},
			error => {
				if (error) { return callback(error); }
				this.message = {
					user: {
						_id: this.currentUser._id,
						unset: {
							lastReads: true
						}
					}
				};
				callback();
			}
		);
	}
}

module.exports = ReadAllMessageTest;
