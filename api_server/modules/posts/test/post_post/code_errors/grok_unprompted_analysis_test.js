'use strict';

const CodeErrorTest = require('./code_error_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class GrokUnpromptedAnalysisTest extends CodeErrorTest {
	get description () {
		return 'post and code error are set to be analyzed by grok using an unprompted analysis';
	}

	// run the actual test...
	run (callback) {
		// we'll run the update, but also verify the update took by fetching and validating
		// the team object
		BoundAsync.series(this, [
			super.run,
			this.wait,
			this.validateTeam,
			this.validatePostThread		
		], callback);
	}

	// form the data for the post we'll create in the test
	makePostData (callback) {
		super.makePostData(() => {
			this.data.analyze = true;	// this makes it 'unprompted'
			callback();
		});
	}

	wait (callback) {
		setTimeout(callback, 2500);
	}

	// fetch and validate the team object against the update we made
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

module.exports = GrokUnpromptedAnalysisTest;
