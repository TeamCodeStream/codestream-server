'use strict';

var Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
var CommonInit = require('./common_init');

class MessageToTeamTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	constructor (options) {
		super(options);
		this.numPosts = 10;
		this.numEdits = 20;
	}

	get description () {
		return 'members of the team should receive a message with the marker location update when a marker location calculation is made';
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	// set the pubnub channel name we expect a message on
	setChannelName (callback) {
		// marker location messages come to us on the team channel
		this.channelName = 'team-' + this.team._id;
		callback();
	}

	// generate the message by triggering a request to the api server
	generateMessage (callback) {
		// PUT the marker locations to the server, this should trigger an update message to the team
		this.doApiRequest(
			{
				method: 'put',
				path: '/calculate-locations',
				data: this.data,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				// we expect the same message through the channel that we get through the response
				this.message = response;
				callback();
			}
		);
	}
}

module.exports = MessageToTeamTest;
