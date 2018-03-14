'use strict';

var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
var ComplexUpdate = require('./complex_update');

class MessageTest extends CodeStreamMessageTest {

	get description () {
		return 'the user should receive a message on their me-channel when they update their preferences';
	}

	// make some test data before running the test
	makeData (callback) {
		// set some complex preferences data
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

	// set the channel name to listen on
	setChannelName (callback) {
		// preference changes come back to the user on their own me-channel
		this.channelName = 'user-' + this.currentUser._id;
		callback();
	}

	// do the request that triggers the message being sent
	generateMessage (callback) {
		// apply a complex update operation to the already "complex" preferences
		// data, and confirm the appropriate complex op to apply at the client
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
