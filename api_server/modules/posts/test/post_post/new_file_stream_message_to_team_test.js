'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const PostPostTest = require('./post_post_test');
const CommonInit = require('./common_init');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');

class NewFileStreamMessageToTeamTest extends Aggregation(CodeStreamMessageTest, CommonInit, PostPostTest) {

	get description () {
		return 'members of the team should receive a message with the post when a post is posted to a team stream';
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.streamOptions.isTeamStream = true;
			callback();
		});
	}

	makePostData (callback) {
		super.makePostData (() => {
			// add codemark and marker data to the post
			this.data.codemark = this.codemarkFactory.getRandomCodemarkData();
			this.data.codemark.markers = this.markerFactory.createRandomMarkers(1, { withRandomStream: true });
			callback();
		});
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// when posted to a team stream, it is the team channel
		this.channelName = `team-${this.team.id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/posts',
				data: this.data,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.message = response;
				callback();
			}
		);
	}
}

module.exports = NewFileStreamMessageToTeamTest;
