'use strict';

const Assert = require('assert');
const GrokPromptedAnalysisTest = require('./grok_prompted_analysis_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class GrokPromptedAnalysisReplyTest extends GrokPromptedAnalysisTest {
	get description () {
		return 'grok analysis can continue with a reply to the original post when mentioning @grok';
	}

	// run the actual test...
	run (callback) {
		// we'll run the update, but also verify the update took by fetching and validating
		// the team object
		BoundAsync.series(this, [
			super.run,
			this.mentionUserInReply,
			this.wait,
			this.validatePostThreadReplies		
		], callback);
	}

	mentionUserInReply (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/posts',
				data: {
					parentPostId: this.data.codeError.postId,
					streamId: this.expectedStreamId,
					text: '@grok'
				},
				token: this.token
			},
			callback
		);
	}

	// fetch and validate the team object against the update we made
	validatePostThreadReplies (callback) {
		this.doApiRequest({
		 	method: 'get',
		 	path: `/posts?streamId=${this.expectedStreamId}`,
		 	token: this.token
		}, (error, response) => {
			if (error) { 
				return callback(error); 
			}

			Assert.equal(response.posts.length, 4);

			const grokReplies = response.posts.filter(p => p.promptRole === "assistant");

			Assert.equal(grokReplies.length, 2)

			callback();
		});
	}
}

module.exports = GrokPromptedAnalysisReplyTest;