'use strict';

const Assert = require('assert');
const PostReplyTest = require('../post_reply_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class GrokUnpromptedAnalysisReplyTest extends PostReplyTest {

	run (callback) {
		BoundAsync.series(this, [
			super.run,
			this.wait,
			this.validatePostThreadReplies,
			this.validateTeam		
		], callback);
	}

	wait (callback) {
		const time = this.usingSocketCluster ? 0 : (this.mockMode ? 100 : 5000);
		setTimeout(callback, time);
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
			this.data.analyze = true;	// this makes it 'unprompted'
			delete this.data.codeError;
			callback();
		});
	}

	get description () {
		return 'grok analysis can begin with a reply to a post/codeError that wasnt already analyzed, if the analyze property is sent';
	}

	validatePostThreadReplies (callback) {
		this.doApiRequest({
		 	method: 'get',
		 	path: `/posts?streamId=${this.expectedStreamId}`,
		 	token: this.token
		}, (error, response) => {
			if (error) { 
				return callback(error); 
			}

			Assert.equal(response.posts.length, 3);

			const grokReplies = response.posts.filter(p => p.forGrok === true);

			Assert.equal(grokReplies.length, 1)

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

module.exports = GrokUnpromptedAnalysisReplyTest;
