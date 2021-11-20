'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CommonInit = require('./common_init');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class MessageToTeamChannelTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		return 'members of the team that owns a code error should receive a message with the reply when a code error is replied to using the comment engine';
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	init (callback) {
		BoundAsync.series(this, [
			super.init,
			this.createNRComment,
			this.claimCodeError
		], callback);
	}
	
	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// when posted to a team stream, it is the team channel
		this.channelName = `team-${this.team.id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		const data = this.nrCommentFactory.getRandomNRCommentData();
		const { objectId, objectType, accountId, id } = this.nrCommentResponse.post;
		Object.assign(data, {
			objectId,
			objectType,
			accountId,
			parentPostId: id
		});

		this.doApiRequest(
			{
				method: 'post',
				path: `/nr-comments`,
				data,
				requestOptions: {
					headers: {
						'X-CS-NewRelic-Secret': this.apiConfig.sharedSecrets.commentEngine,
						'X-CS-NewRelic-AccountId': data.accountId,
						'X-CS-Want-CS-Response': this.apiConfig.sharedSecrets.commentEngine
					}
				}
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.message = response.codeStreamResponse;
				callback();
			}
		);
	}
}

module.exports = MessageToTeamChannelTest;
