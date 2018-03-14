'use strict';

var ReadMessageTest = require('./read_message_test');

class ReadAllMessageTest extends ReadMessageTest {

	get description () {
		return 'the user should receive a message on their me-channel when they indicate they have read all messages in all streams';
	}

	// trigger the api request that generates the message
	generateMessage (callback) {
		// do the read/all request
		this.doApiRequest(
			{
				method: 'put',
				path: '/read/all',
				token: this.token
			},
			error => {
				if (error) { return callback(error); }
				// we expect to get a message to unset the entire lastReads object
				this.message = {
					user: {
						_id: this.currentUser._id,
						'$unset': {
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
