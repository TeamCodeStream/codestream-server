'use strict';

const CodeErrorTest = require('./code_error_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class GrokUnpromptedAnalysisTest extends CodeErrorTest {
	get description () {
		return 'grok analysis can begin with a post if the analyze property is sent';
	}

	run (callback) {
		BoundAsync.series(this, [
			super.run,
			this.wait,
			this.validateTeam,
			this.validatePostThread		
		], callback);
	}

	wait (callback) {
		const time = this.usingSocketCluster ? 0 : (this.mockMode ? 100 : 5000);
		setTimeout(callback, time);
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.analyze = true;	// this makes it 'unprompted'
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

			Assert(parentPost !== undefined);

			const reply = response.posts.find(p => p.parentPostId === parentPost.id);

			Assert(reply !== undefined && reply.forGrok === true);

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

module.exports = GrokUnpromptedAnalysisTest;
