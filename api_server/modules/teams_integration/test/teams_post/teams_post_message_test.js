'use strict';

var Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
var CommonInit = require('./common_init');

class TeamsPostMessageTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		return 'should create and publish a post when a teams post call is made';
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// it is the team channel
		this.channelName = 'team-' + this.team._id;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// simulate a teams post by calling the API server's teams-post
		// call with post data, this should trigger post creation and a publish
		// of the post through the team channel
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/teams-post',
				data: this.data
			},
			(error, response) => {
				if (error) { return callback(error); }
				// we don't expect these response elements in the received message
				delete response.parentPost;
				delete response.repo;
				delete response.stream;
				this.message = response;	// we expect the same info through pubnub
				callback();
			}
		);
	}
}

module.exports = TeamsPostMessageTest;
