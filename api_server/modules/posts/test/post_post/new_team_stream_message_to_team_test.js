'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const PostToChannelTest = require('./post_to_channel_test');
const CommonInit = require('./common_init');
const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');

class NewTeamStreamMessageToTeamTest extends Aggregation(CodeStreamMessageTest, CommonInit, PostToChannelTest) {

	get description () {
		return 'members of the team should receive a message with the stream and the post when a post is posted to a team stream created on the fly';
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// it is the team channel
		this.channelName = `team-${this.team._id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// we'll create a post and a channel stream "on-the-fly",
		// with isTeamStream set ...
		// this should trigger a message to the team channel that
		// indicates the stream was created
		const streamOptions = {
			type: 'channel',
			isTeamStream: true,
			name: this.teamFactory.randomName(),
			teamId: this.team._id
		};
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.message = response; // the message should look just like the response
				callback();
			},
			{
				token: this.users[1].accessToken,	// the "post creator"
				teamId: this.team._id,
				wantCodeBlocks: 1,		// let's do a code block for good measure
				stream: streamOptions
			}
		);
	}
    
	validateMessage (message) {
		if (!message.message.post) {
			return false;
		}
		return super.validateMessage(message);
	}
}

module.exports = NewTeamStreamMessageToTeamTest;
