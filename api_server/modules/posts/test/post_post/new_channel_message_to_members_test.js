'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const PostToChannelTest = require('./post_to_channel_test');
const CommonInit = require('./common_init');
const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');

class NewChannelMessageToMembersTest extends Aggregation(CodeStreamMessageTest, CommonInit, PostToChannelTest) {

	get description () {
		return `members of the stream should receive a message with the stream when a post is posted to a ${this.type} stream created on the fly`;
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// each user should individually receive a message with the stream
		// the have now been added to
		this.channelName = 'user-' + this.currentUser.user._id;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// we'll create a post and a stream "on-the-fly" ...
		// this should trigger a message to the user channel
		// for every user in the stream, indicating they have been
		// added to a stream
		const streamOptions = {
			type: 'channel',
			name: this.teamFactory.randomName(),
			teamId: this.team._id,
			memberIds: [this.currentUser.user._id]	// include the current user in the stream
		};
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.message = { stream: response.streams[0] };
				callback();
			},
			{
				token: this.users[1].accessToken,	// the "post creator" will create the post and the stream on the fly
				teamId: this.team._id,
				stream: streamOptions
			}
		);
	}
}

module.exports = NewChannelMessageToMembersTest;
