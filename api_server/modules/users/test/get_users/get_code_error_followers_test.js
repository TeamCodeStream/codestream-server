'use strict';

const GetUsersTest = require('./get_users_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const RandomString = require('randomstring');
const Assert = require('assert');

class GetCodeErrorFollowersTest extends GetUsersTest {

	constructor (options) {
		super(options);
		Object.assign(this.userOptions, {
			numRegistered: 5,
			numUnregistered: 2
		});
		Object.assign(this.teamOptions, {
			members: [0, 1, 2, 3, 5]
		});
		Object.assign(this.postOptions, {
			creatorIndex: 0,
			numPosts: 1,
			wantCodeError: true
		});
	}
	
	get description () {
		return 'should return the users following a code error when requested, regardless of whether they are on my team';
	}

	// before the test runs...
	before (callback) {
		this.myUsers = [];
		BoundAsync.series(this, [
			super.before,		// run standard setup for test of fetching users
			this.mentionUsers,	// mention some users in replies to those code errors, making them followers
			this.createNRComments	// create some NR comments to these code errors, making followers of the external users
		], callback);
	}

	// mention some users, making them followers that we should be able to fetch
	mentionUsers (callback) {
		BoundAsync.timesSeries(
			this,
			2,
			this.mentionUser,
			callback
		);
	}

	// mention a user in a comment to a code error, making them a follower
	mentionUser (n, callback) {
		const nUser = n === 0 ? 2 : 5;
		const user = this.users[nUser].user;
		this.myUsers.push(user);
		this.doApiRequest(
			{
				method: 'post',
				path: '/posts',
				data: {
					parentPostId: this.postData[0].post.id,
					streamId: this.postData[0].post.streamId,
					text: RandomString.generate(100),
					mentionedUserIds: [user.id]
				},
				token: this.users[0].accessToken
			},
			callback
		);
	}

	// create some comments from external users using the NR comment engine, this makes them followers
	createNRComments (callback) {
		this.externalUserIds = [];
		BoundAsync.timesSeries(
			this,
			5,
			this.createNRComment,
			callback
		);
	}

	// create a comment from an external user (registered or otherwise) using the NR comment engine,
	// making the external user a follower
	createNRComment (n, callback) {
		const data = this.nrCommentFactory.getRandomNRCommentData();
		const codeError = this.postData[0].codeError;
		Object.assign(data, {
			objectId: codeError.objectId,
			objectType: codeError.objectType,
			accountId: codeError.accountId,
			mentionedUsers: [{
				email: this.userFactory.randomEmail()
			}]
		});
		let nUser;
		if (n === 0) {
			nUser = 4;
		} else if (n === 1) {
			nUser = 6;
		} else if (n === 2) {
			nUser = 8;
		}
		if (nUser) {
			const user = this.users[nUser].user;
			data.creator.email = user.email;
			this.myUsers.push(user);
		}

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
			(error, response) => {
				if (error) { return callback(error); }
				if (!nUser) {
					this.externalUserIds.push(response.post.creatorId);
				}
				this.externalUserIds.push(response.post.mentionedUserIds[0]);
				callback();
			}
		);
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		this.myUsers.push(this.currentUser.user);
		this.path = `/users?codeErrorId=${this.postData[0].codeError.id}`;
		callback();
	}

	validateResponse (data) {
		for (let userId of this.externalUserIds) {
			const user = data.users.find(u => {
				return u.id === userId;
			});
			Assert(user, `external user ${userId} not found`);
			this.myUsers.push(user);
		}
		super.validateResponse(data);
	}
}

module.exports = GetCodeErrorFollowersTest;
