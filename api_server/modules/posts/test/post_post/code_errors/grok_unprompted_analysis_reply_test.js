'use strict';

const Assert = require('assert');
const PostReplyTest = require('../post_reply_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class GrokUnpromptedAnalysisReplyTest extends PostReplyTest {

	// run the actual test...
	run (callback) {
		// we'll run the update, but also verify the update took by fetching and validating
		// the team object
		BoundAsync.series(this, [
			super.run,
			this.wait,
			this.validatePostThreadReplies,
			this.validateTeam		
		], callback);
	}

	wait (callback) {
		setTimeout(callback, 2500);
	}

	setTestOptions (callback) {
		this.expectedStreamVersion = 2;
		super.setTestOptions(() => {
			Object.assign(this.postOptions, {
				creatorIndex: 1,
				wantCodeError: true
			});
			callback();
		});
	}

	makePostData (callback) {
		super.makePostData(error => {
			if (error) { return callback(error); }
			this.data.streamId = this.postData[0].codeError.streamId;
			this.expectedStreamId = this.postData[0].codeError.streamId;
			this.data.analyze = true;
			delete this.data.codeError;
			callback();
		});
	}

	get description () {
		return 'post and code error are set to be analyzed by grok using an unprompted analysis via a reply';
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

			const parentPost = response.posts.find(p => p.parentPostId === undefined);

			Assert(
				parentPost.grokConversation !== undefined && 
				parentPost.forGrok === undefined);

			Assert.equal(response.posts.length, 3);

			const grokReplies = response.posts.filter(p => p.promptRole === "assistant");

			Assert.equal(grokReplies.length, 1)

			callback();
		});
	}

		// fetch and validate the team object now has a Grok user
		validateTeam (callback) {
			this.doApiRequest({
					method: 'get',
					path: `/teams/${this.team.id}`,
					token: this.token
			}, (error, response) => {
				if (error) { 
					return callback(error); 
				}
				Assert(response.team.grokUserId !== undefined);
	
				callback();
			});
		}
}

module.exports = GrokUnpromptedAnalysisReplyTest;
