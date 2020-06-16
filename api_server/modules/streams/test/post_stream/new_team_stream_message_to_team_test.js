'use strict';

const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');
const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const PostTeamStreamTest = require('./post_team_stream_test');

class NewTeamStreamMessageToTeamTest extends Aggregation(CodeStreamMessageTest, CommonInit, PostTeamStreamTest) {

	constructor (options) {
		super(options);
		this.type = 'channel';
	}

	get description () {
		return 'members of the team should receive a message with the stream when a team stream is added to the team';
	}

	// make the data to use for the test
	makeData (callback) {
		this.init(callback);
	}

	// set the name of the channel to listen for the message on
	setChannelName (callback) {
		// when a team stream is created, we should get a message on the team channel
		this.channelName = `team-${this.team.id}`;
		callback();
	}

	// issue the request that will trigger the message to be sent
	generateMessage (callback) {
		// create a file-type stream, this should send a message on the team channel
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.message = { stream: response.stream };	// expect the stream as the message
				callback();
			},
			{
				token: this.users[1].accessToken,	// stream creator creates the stream
				teamId: this.team.id,
				type: 'channel',
				isTeamStream: true
			}
		);
	}
}

module.exports = NewTeamStreamMessageToTeamTest;
