'use strict';

var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
var ComplexUpdate = require('./complex_update');

class MessageTest extends CodeStreamMessageTest {

	get description () {
		return 'the user should receive a message on their me-channel when they update their preferences';
	}

	makeData (callback) {
		let data = ComplexUpdate.INITIAL_PREFERENCES;
		this.doApiRequest(
			{
				method: 'put',
				path: '/preferences',
				data: data,
				token: this.token
			},
			callback
		);
	}

	setChannelName (callback) {
		this.channelName = 'user-' + this.currentUser._id;
		callback();
	}

	generateMessage (callback) {
		let data = ComplexUpdate.UPDATE_OP;
		this.doApiRequest(
			{
				method: 'put',
				path: '/preferences',
				data: data,
				token: this.token
			},
			error => {
				if (error) { return callback(error); }
				this.message = {
					user: {
						_id: this.currentUser._id
					}
				};
				Object.assign(this.message.user, ComplexUpdate.EXPECTED_OP);
				callback();
			}
		);
	}
}

module.exports = MessageTest;
