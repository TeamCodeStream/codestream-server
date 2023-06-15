'use strict';

const Assert = require('assert');
const GrokUnpromptedAnalysisTest = require('./grok_unprompted_analysis_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class GrokUnpromptedAnalysisReinitializeTest extends GrokUnpromptedAnalysisTest {
	get description () {
		return 'grok analysis can be reinitialized with a post if the reinitialized property is sent';
	}

	run (callback) {
		if(!this.mockMode){
			Assert.equal(true, true, "Test requires Mock Mode!");
			callback();
		}
		else{
			BoundAsync.series(this, [
				super.run,
				this.makeCallToReinitialize,
				this.wait,
				this.validatePostThreadForReinitialize	
			], callback);
		}
	}

	wait (callback) {
		const time = this.usingSocketCluster ? 0 : (this.mockMode ? 100 : 5000);
		setTimeout(callback, time);
	}

	makeCallToReinitialize (callback) {
		const parentPostId = this.data.codeError.postId;

		this.doApiRequest(
			{
				method: 'post',
				path: '/posts',
				data: {
					parentPostId: parentPostId,
					streamId: this.expectedStreamId,
					reinitialize: true,
					text: 'reinitialize grok'
				},
				token: this.token
			},
			(error, response) => {
				if (error) { 
					return callback(error); 
				}

				Assert(response.post.id === parentPostId, `post id in response does not match parent post id: ${response.post.id} !== ${parentPostId}`);
				Assert(response.codeError.id === response.post.codeErrorId, `code error id in response does not match post code error id: ${response.codeError.id} !== ${response.post.codeErrorId}`)

				callback();
			}
		);
	}

	// if reinitialization worked, there will be only ONE extra post in this response
	// than in the GrokUnpromptedAnalysisTest response. The extra post will be the
	// response from Grok for a second time. If the post above also got created, there
	// would be TWO more posts in the collection.
	validatePostThreadForReinitialize (callback) {
		this.doApiRequest({
		 	method: 'get',
		 	path: `/posts?streamId=${this.expectedStreamId}`,
		 	token: this.token
		}, (error, response) => {
			if (error) { 
				return callback(error); 
			}
			
			Assert.equal(response.posts.length, 3);

			const parentPost = response.posts.find(p => p.parentPostId === undefined);

			Assert(parentPost !== undefined);

			const replies = response.posts.filter(p => p.parentPostId === parentPost.id);

			Assert(replies !== undefined && replies.length === 2);

			Assert(replies.every(r => r.forGrok === true));

			callback();
		});
	}
}

module.exports = GrokUnpromptedAnalysisReinitializeTest;
