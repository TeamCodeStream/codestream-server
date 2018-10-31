'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
const PostReplyTest = require('./post_reply_test');
const CommonInit = require('./common_init');

class NumCommentsMessageTest extends Aggregation(CodeStreamMessageTest, CommonInit, PostReplyTest) {

	get description () {
		return 'members of the team should receive a message when the numComments attribute of a marker is incremented due to a reply to a post with markers';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.postOptions.wantMarker = true;
			this.streamOptions.type = 'file';
			this.repoOptions.creatorIndex = 1;
			callback();
		});
	}

	// make the data that triggers the message to be messageReceived
	makeData (callback) {
		this.init(callback);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// since this is in a file stream, we'll see it on the team channel
		this.channelName = `team-${this.team._id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// we'll create a post as a reply to the parent post we already created ...
		// since the parent post had a marker, this should cause a message to
		// be sent on the the team channel indicating the numComments field for
		// the marker to the marker has been incremented
		this.doApiRequest(
			{
				method: 'post',
				path: '/posts',
				data: this.data,
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				// the message should look like this, indicating the numComments
				// attribute for the marker to the reply post has been incremented
				this.message = {
					post: response.post,
					markers: [{
						_id: this.postData[0].post.markers[0].markerId,
						$inc: { 
							numComments: 1 
						},
						$version: {
							before: 1,
							after: 2
						},
						$set: {
							version: 2
						}
					}],
					streams: response.streams
				};
				callback();
			}
		);
	}

	// validate the message received against expectations
	validateMessage (message) {
		// ignore any message having to do with the parent post
		if (message.message.post && message.message.post._id === this.postData[0].post._id) {
			return false;
		}
		return super.validateMessage(message);
	}
}

module.exports = NumCommentsMessageTest;
