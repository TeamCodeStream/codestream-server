'use strict';

var Read_Message_Test = require('./read_message_test');

class Read_All_Message_Test extends Read_Message_Test {

	get description () {
		return 'the user should receive a message on their me-channel when they indicate they have read all messages in all streams';
	}

	generate_message (callback) {
		this.do_api_request(
			{
				method: 'put',
				path: '/read/all',
				token: this.token
			},
			error => {
				if (error) { return callback(error); }
				this.message = {
					user: {
						_id: this.current_user._id,
						unset: {
							last_reads: true
						}
					}
				};
				callback();
			}
		);
	}
}

module.exports = Read_All_Message_Test;
