'use strict';

const GetNRCommentTest = require('./get_nr_comment_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const RandomString = require('randomstring');

class ReactionsTest extends GetNRCommentTest {

	get description () {
		return 'should return a New Relic comment when requested, with reactions included';
	}

	// before the test runs...
	before (callback) {
		this.ownedByTeam = true;
		BoundAsync.series(this, [
			super.before,
			this.reply,
			this.react
		], callback);
	}

	reply (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/nr-comments',
				data: {
					creator: {
						email: this.users[0].user.email,
						fullName: this.users[0].user.fullName,
						username: this.users[0].user.username
					},
					objectId: this.nrCommentResponse.post.objectId,
					objectType: this.nrCommentResponse.post.objectType,
					accountId: this.nrCommentResponse.post.accountId,
					text: RandomString.generate(100)
				},
				requestOptions: {
					headers: {
						'X-CS-NewRelic-Secret': this.apiConfig.sharedSecrets.commentEngine,
						'X-CS-NewRelic-AccountId': this.nrCommentResponse.post.accountId
					}
				},
				token: this.users[0].accessToken
			},
			callback
		)
	}

	react (callback) {
		this.commonReaction = RandomString.generate(10);
		this.modifiedAfter = Date.now();
		Object.assign(this.expectedResponse.post, {
			reactions: {
				[this.commonReaction]: [this.users[0].user.id, this.users[1].user.id]
			},
			version: 3,
		});
		const user0 = this.users[0].user;
		Object.assign(this.expectedResponse.post.userMaps, {
			[user0.id]: {
				email: user0.email,
				username: user0.username,
				fullName: user0.fullName
			}
		});

		BoundAsync.timesSeries(
			this,
			2,
			this.reactToComment,
			callback
		);
	}

	reactToComment (n, callback) {
		const reaction = RandomString.generate(10);
		this.doApiRequest(
			{
				method: 'put',
				path: `/react/${this.nrCommentResponse.post.id}`,
				data: {
					[this.commonReaction]: true,
					[reaction]: true
				},
				token: this.users[n].accessToken
			},
			error => {
				if (error) { return callback(error); }
				this.expectedResponse.post.reactions[reaction] = [this.users[n].user.id];
				callback();
			}
		)
	}
}

module.exports = ReactionsTest;
