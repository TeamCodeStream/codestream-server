'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const PostToChannelTest = require('./post_to_file_stream_test');
const CommonInit = require('./common_init');
const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');

class NewRepoMessageToTeamTest extends Aggregation(CodeStreamMessageTest, CommonInit, PostToChannelTest) {

	get description () {
		return 'members of the team should receive a message with the repo when a post is posted with a code block from a file stream created on the fly where the repo is also created on the fly';
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
		// we'll create a post and a code block from a stream to be created "on-the-fly" ...
		// this should trigger a message to the team channel that indicates the stream was created
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.message = { repos: response.repos }; // the message should be the repo
				callback();
			},
			{
				token: this.users[1].accessToken,	// the "post creator"
				teamId: this.team._id,
				streamId: this.stream._id,
				wantCodeBlocks: 1,
				codeBlockStream: {
					remotes: [this.repoFactory.randomUrl()],
					file: this.streamFactory.randomFile()
				}
			}
		);
	}

	// validate the incoming message
	validateMessage (message) {
		// ignore the message publishing the new file-stream, we only want the repo message
		if (message.message.stream) { return false; }
		return true;
	}
}

module.exports = NewRepoMessageToTeamTest;
