'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class ACLTeamlessObjectStreamTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.teamOptions.creatorIndex = 1;
	}

	get description () {
		return 'should return an error when trying to fetch posts from a teamless object stream, created for the NR comment engine and never claimed by a team';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createCodeError,
			this.createReplies,
			this.setPath			// set the path for our request to retrieve posts
		], callback);
	}

	// create a teamless code error through the NR comment engine
	createCodeError (callback) {
		this.nrCommentData = this.nrCommentFactory.getRandomNRCommentData();
		this.doApiRequest(
			{
				method: 'post',
				path: `/nr-comments`,
				data: this.nrCommentData,
				requestOptions: {
					headers: {
						'X-CS-NewRelic-Secret': this.apiConfig.sharedSecrets.commentEngine,
						'X-CS-NewRelic-AccountId': this.nrCommentData.accountId,
						'X-CS-Want-CS-Response': this.apiConfig.sharedSecrets.commentEngine
					}
				}
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.nrCommentResponse = response;
				callback();
			}
		);
	}

	// create a few replies to the teamless code error
	createReplies (callback) {
		BoundAsync.timesSeries(
			this,
			3,
			this.createReply,
			callback
		);
	}

	// create a reply to the teamless code error
	createReply (n, callback) {
		const data = this.nrCommentFactory.getRandomNRCommentData();
		Object.assign(data, {
			accountId: this.nrCommentData.accountId,
			objectId: this.nrCommentData.objectId,
			objectType: this.nrCommentData.objectType,
			parentPostId: this.nrCommentResponse.post.id
		});
		this.doApiRequest(
			{
				method: 'post',
				path: `/nr-comments`,
				data,
				requestOptions: {
					headers: {
						'X-CS-NewRelic-Secret': this.apiConfig.sharedSecrets.commentEngine,
						'X-CS-NewRelic-AccountId': data.accountId
					}
				}
			},
			callback
		);
	}

	// set the path to use for the fetch request
	setPath (callback) {
		const streamId = this.nrCommentResponse.codeStreamResponse.codeError.streamId
		this.path = `/posts?teamId=${this.team.id}&streamId=${streamId}`;
		callback();
	}
}

module.exports = ACLTeamlessObjectStreamTest;
