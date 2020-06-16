// base class for many tests of the "PUT /pin-post" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');
const RandomString = require('randomstring');

class CommonInit {

	init (callback) {
		this.expectedVersion = 3;
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.makePostlessCodemark,	// make a postless codemark, as needed
			this.createReply,			// create the reply post
			this.makeRequestData		// make the request data
		], callback);
	}

	// set options to use when running the test
	setTestOptions (callback) {
		this.teamOptions.creatorIndex = 1;
		this.streamOptions.creatorIndex = 1;
		if (this.streamType === 'team stream') {
			Object.assign(this.streamOptions, {
				type: 'channel',
				isTeamStream: true
			});
		}
		else {
			this.streamOptions.type = this.streamType || 'channel';
		}
		if (!this.goPostless) {
			Object.assign(this.postOptions, {
				creatorIndex: 1,
				wantCodemark: true,
				codemarkType: this.codemarkType || 'comment'
			});
		}
		callback();
	}

	// make a postless codemark, as needed for the test
	makePostlessCodemark (callback) {
		if (!this.goPostless) {
			this.codemark = this.postData[0].codemark;
			return callback();
		}
		const codemarkData = this.getPostlessCodemarkData();
		this.doApiRequest(
			{
				method: 'post',
				path: '/codemarks',
				data: codemarkData,
				token: this.currentUser.accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.codemark = response.codemark;
				callback();
			}
		);
	}

	// get data to use for the postless codemark, as needed
	getPostlessCodemarkData () {
		const data = this.codemarkFactory.getRandomCodemarkData({ codemarkType: this.codemarkType || 'comment' });
		Object.assign(data, {
			teamId: this.team.id,
			providerType: RandomString.generate(8)
		});
		return data;
	}

	// make the post that will be a reply to the codemark
	createReply (callback) {
		this.replyCreatedAfter = Date.now();
		if (this.goPostless) { 
			return callback();	// doesn't apply to third-party provider posts
		}
		const postOptions = {
			streamId: this.stream.id,
			token: this.users[1].accessToken
		};
		if (!this.noReply) {
			postOptions.parentPostId = this.postData[0].post.id;
		}
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.replyPost = response.post;
				callback();
			},
			postOptions
		);
	}

	// make the data to use when issuing the test request
	makeRequestData (callback) {
		const postId = this.goPostless ? RandomString.generate(8) : this.replyPost.id;
		this.data = {
			codemarkId: this.codemark.id,
			postId
		};
		this.expectedData = {
			codemark: {
				_id: this.codemark.id,	// DEPRECATE ME
				id: this.codemark.id,
				$addToSet: {
					pinnedReplies: postId
				},
				$set: {
					version: this.expectedVersion,
					modifiedAt: Date.now() // placeholder
				},
				$version: {
					before: this.expectedVersion - 1,
					after: this.expectedVersion
				}
			}
		};
		this.expectedCodemark = DeepClone(this.codemark);
		this.expectedCodemark.version = this.expectedVersion;
		this.expectedCodemark.numReplies = 1;
		this.expectedCodemark.pinnedReplies = [postId];
		this.modifiedAfter = Date.now();
		this.path = '/pin-post';
		callback();
	}

	// perform the actual update 
	pinPost (callback) {
		const postId = this.goPostless ? RandomString.generate(8) : this.replyPost.id;
		this.doApiRequest(
			{
				method: 'put',
				path: '/pin-post',
				data: {
					codemarkId: this.codemark.id,
					postId
				},
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.message = response;
				delete this.data;	// don't need this anymore
				callback();
			}
		);
	}
}

module.exports = CommonInit;
