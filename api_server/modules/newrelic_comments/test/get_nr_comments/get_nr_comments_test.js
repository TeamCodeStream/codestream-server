'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');
const RandomString = require('randomstring');

class GetNRCommentsTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.numComments = 5;
	}

	get description () {
		return 'should return New Relic comments when requested';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.setPath,
			this.createNRComments,
			//this.claimCodeErrors
		], callback);
	}

	// set the path to use for the test request
	setPath (callback) {
		this.accountId = this.codeErrorFactory.randomAccountId();
		this.objectId = this.codeErrorFactory.randomObjectId();
		this.objectType = 'errorGroup';
		this.path = `/nr-comments?objectId=${this.objectId}&objectType=${this.objectType}`;
		callback();
	}

	// form the data for the generating the NewRelic comments
	makeNRCommentData () {
		const data = this.nrCommentFactory.getRandomNRCommentData();
		Object.assign(data, {
			accountId: this.accountId,
			objectId: this.objectId,
			objectType: this.objectType
		});
		this.apiRequestOptions = {
			headers: {
				'X-CS-NewRelic-Secret': this.apiConfig.sharedSecrets.commentEngine,
				'X-CS-NewRelic-AccountId': this.accountId
			}
		};
		return data;
	}

	// create the comments
	createNRComments (callback) {
		this.expectedResponse = [];
		BoundAsync.timesSeries(
			this,
			this.numComments,
			this.createNRComment,
			callback
		);
	}

	createNRComment (n, callback) {
		const options = (this.commentData && this.commentData[n]) || {}
		if (options.wantCodemark) {
			// create a codemark as if from CodeStream instead
			return this.createCodemark(n, callback);
		}

		const data = this.makeNRCommentData();

		// if replying to another comment, set parentPostId
		if (options.replyTo !== undefined || options.replyFromCSTo) {
			const replyTo = options.replyTo || options.replyFromCSTo;
			const parentPost = this.expectedResponse[replyTo];
			data.parentPostId = parentPost.id;
			parentPost.version++;
		 	parentPost.modifiedAt = Date.now();
			if (options.replyFromCSTo) {
				// send the reply as if from CodeStream
				return this.createCodeStreamReply(n, parentPost, callback);
			}
		}

		// specify existing CodeStream user as desired
		if (options.author !== undefined) {
			data.creator = {
				email: this.users[options.author].user.email
			}
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
				this.expectedResponse.push(response.post);
				if (this.claimAfter === n) {
					this.claimCodeError(callback);
				} else {
					callback();
				}
			}
		);
	}

	// claim code error for the team, as requested
	claimCodeError (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/code-errors/claim/' + this.team.id,
				data: {
					objectId: this.objectId,
					objectType: this.objectType
				},
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.claimResponse = response;
				callback();
			}
		);
	}

	// create a post with a codemark, as if from CodeStream
	createCodemark (n, callback) {
		const codemarkData = this.codemarkFactory.getRandomCodemarkData({ wantMarkers: 2, withRandomStream: true });
		const postData = {
			teamId: this.team.id,
			streamId: this.claimResponse.stream.id,
			parentPostId: this.claimResponse.post.id,
			codemark: codemarkData,
			text: codemarkData.text
		};

		const options = (this.commentData && this.commentData[n]) || {};
		let token = this.token;
		let whichUser = 0;
		if (options.author !== undefined) {
			whichUser = options.author;
			token = this.users[whichUser].accessToken;
		}

		this.doApiRequest(
			{
				method: 'post',
				path: '/posts',
				data: postData,
				token
			},
			(error, response) => {
				if (error) { return callback(error); }
				const { post, codemark, markers } = response;
				const { user } = this.users[whichUser];
				this.expectedResponse.push({
					id: post.id,
					version: post.version,
					creator: {
						email: user.email,
						fullName: user.fullName,
						username: user.username
					},
					creatorId: user.id,
					createdAt: post.createdAt,
					modifiedAt: post.modifiedAt,
					deactivated: false,
					accountId: this.accountId,
					objectId: this.objectId,
					objectType: this.objectType,
					mentionedUsers: [],
					mentionedUserIds: [],
					parentPostId: this.claimResponse.post.id,
					text: codemark.text,
					seqNum: post.seqNum,
					reactions: {},
					files: [],
					codeBlocks: markers.map(marker => {
						return {
							code: marker.code,
							file: marker.file,
							permalink: `${codemark.permalink}?markerId=${marker.id}`,
							repo: marker.repo,
							sha: marker.commitHashWhenCreated
						}
					}),
					userMaps: {
						[user.id]: {
							email: user.email,
							fullName: user.fullName,
							username: user.username
						}
					}
				});
				callback();
			}
		);
	}

	// create a reply to a codemark, as if from CodeStream
	createCodeStreamReply (n, parentPost, callback) {
		const postData = {
			teamId: this.team.id,
			streamId: this.claimResponse.stream.id,
			parentPostId: parentPost.id,
			text: RandomString.generate(100)
		};

		const options = (this.commentData && this.commentData[n]) || {};
		let token = this.token;
		let whichUser = 0;
		if (options.author !== undefined) {
			whichUser = options.author;
			token = this.users[whichUser].accessToken;
		}

		this.doApiRequest(
			{
				method: 'post',
				path: '/posts',
				data: postData,
				token
			},
			(error, response) => {
				if (error) { return callback(error); }
				const { post } = response;
				const { user } = this.users[whichUser];
				this.expectedResponse.push({
					id: post.id,
					version: post.version,
					creator: {
						email: user.email,
						fullName: user.fullName,
						username: user.username
					},
					creatorId: user.id,
					createdAt: post.createdAt,
					modifiedAt: post.modifiedAt,
					deactivated: false,
					accountId: this.accountId,
					objectId: this.objectId,
					objectType: this.objectType,
					mentionedUsers: [],
					mentionedUserIds: [],
					parentPostId: parentPost.id,
					text: postData.text,
					seqNum: post.seqNum,
					reactions: {},
					files: [],
					codeBlocks: [],
					userMaps: {
						[user.id]: {
							email: user.email,
							fullName: user.fullName,
							username: user.username
						}
					}
				});
				callback();
			}
		);
	}

	// validate the request response
	validateResponse (data) {
		// they come in reverse chronological order, sorted by seqNum
		this.expectedResponse.sort((a, b) => {
			return b.seqNum - a.seqNum;
		});
		this.expectedResponse.forEach((expectedPost, n) => {
			if (expectedPost.version > 1) {
				// this is a reply, so its modifiedAt will have been bumped
				const post = data[n];
				expectedPost.modifiedAt = post.modifiedAt;
			}
		});

		// response should exactly equal the response we got when we created the comment
		Assert.deepStrictEqual(data, this.expectedResponse, 'incorrect response');
	}
}

module.exports = GetNRCommentsTest;
