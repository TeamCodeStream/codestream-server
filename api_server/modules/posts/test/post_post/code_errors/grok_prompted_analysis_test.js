'use strict';

const CodeErrorTest = require('./code_error_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class GrokPromptedAnalysisTest extends CodeErrorTest {
	get description () {
		return 'grok analysis can begin with a post when mentioning @grok';
	}

	run (callback) {
		BoundAsync.series(this, [
			super.run,
			this.validateTeam,
			this.validatePostThread		
		], callback);
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.text += "@grok";	// this makes it 'prompted'
			callback();
		});
	}

	validatePostThread (callback) {
		this.doApiRequest({
		 	method: 'get',
		 	path: `/posts?streamId=${this.expectedStreamId}`,
		 	token: this.token
		}, (error, response) => {
			if (error) { 
				return callback(error); 
			}
			Assert.equal(response.posts.length, 2);

			const parentPost = response.posts.find(p => p.parentPostId === undefined);
			const reply = response.posts.find(p => p.parentPostId === parentPost.id);

			Assert(
				parentPost.grokConversation !== undefined && 
				parentPost.forGrok === undefined);
			
			Assert(
				reply.grokConversation === undefined && 
				reply.forGrok !== undefined && 
				reply.promptRole === "assistant");

			callback();
		});
	}

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

module.exports = GrokPromptedAnalysisTest;
