'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const PostToFileStreamTest = require('./post_to_file_stream_test');
const CommonInit = require('./common_init');
const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');

class NewMarkerStreamMessageToTeamTest extends Aggregation(CodeStreamMessageTest, CommonInit, PostToFileStreamTest) {

	get description () {
		return 'members of the team should receive a message with the stream and the post when a post is posted with a marker from a file stream created on the fly';
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
		// we'll create a post and a marker from a stream to be created "on-the-fly" ...
		// this should trigger a message to the team channel that indicates the stream was created
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.message = response; // the message should look just like the response
				callback();
			},
			{
				token: this.users[1].accessToken,
				teamId: this.team._id,
				streamId: this.stream._id,
				wantMarkers: 1,
				markerStream: {
					repoId: this.repo._id,
					file: this.streamFactory.randomFile()
				}
			}
		);
	}
}

module.exports = NewMarkerStreamMessageToTeamTest;
