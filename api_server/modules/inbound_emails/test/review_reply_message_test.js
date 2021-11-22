'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');
const Assert = require('assert');

class ReviewReplyMessageTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		const type = this.isTeamStream ? 'team' : this.type;
		return `should create and publish a post as a reply to the review when an inbound email call is made for a review created in a ${type} stream`;
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.repoOptions.creatorIndex = 1;
			Object.assign(this.postOptions, {
				creatorIndex: 0,
				wantReview: true,
				numChanges: 2,
				wantMarkers: 1
			});
			callback();
		});
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	// make the data to be used in the request that triggers the message
	makePostData (callback) {
		super.makePostData(() => {
			this.data.to[0].address = `${this.postData[0].post.id}.${this.data.to[0].address}`;
			callback();
		});
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// since posting to any stream other than the team stream is no longer allowed,
		// just listen on the team channel
		this.channelName = `team-${this.team.id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// simulate an inbound email by calling the API server's inbound-email
		// call with post data, this should trigger post creation and a publish
		// of the post through the team channel
		this.requestSentAt = Date.now();
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/inbound-email',
				data: this.data
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.message = response;
				callback();
			}
		);
	}
}

module.exports = ReviewReplyMessageTest;
