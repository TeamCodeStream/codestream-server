// base class for many tests of the "PUT /posts" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const RandomString = require('randomstring');

class CommonInit {

	init (callback) {
		this.expectedVersion = 2;
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.makePostData		// make the data to be used during the update
		], callback);
	}

	setTestOptions (callback) {
		this.userOptions.numRegistered = 2;
		this.postOptions.creatorIndex = 0;
		callback();
	}

	// form the data for the post update
	makePostData (callback) {
		const whichPost = this.whichPost || 0;
		this.post = this.postData[whichPost].post;
		this.data = {
			text: this.postFactory.randomText()
		};
		if (this.wantMention) {
			this.data.mentionedUserIds = [this.users[1].user.id];
		}
		if (this.wantSharedTo) {
			this.data.sharedTo = this.getSharedTo();
		}
		this.expectedData = {
			post: {
				_id: this.post.id,	// DEPRECATE ME
				id: this.post.id,
				$set: Object.assign(DeepClone(this.data), { 
					version: this.expectedVersion,
					hasBeenEdited: true,
					modifiedAt: Date.now()	// placeholder
				}),
				$version: {
					before: this.expectedVersion - 1,
					after: this.expectedVersion
				}
			}
		};
		if (this.wantMention) {
			this.expectedData.post.$set.mentionedUserIds = [...this.data.mentionedUserIds];
			this.expectedData.post.$set.mentionedUserIds.sort();
		}
		if (this.wantSharedTo) {
			this.expectedData.post.$set.sharedTo = DeepClone(this.data.sharedTo);
			this.expectedData.post.$set.shareIdentifiers = this.getShareIdentifiers(this.data.sharedTo);
		}
		this.expectedPost = DeepClone(this.post);
		Object.assign(this.expectedPost, this.expectedData.post.$set);
		this.path = '/posts/' + this.post.id;
		this.modifiedAfter = Date.now();
		callback();
	}

	// get "sharedTo" info for the request data, indicating post that has been shared to other providers
	getSharedTo () {
		return [
			{
				createdAt: Date.now(),
				providerId: 'slack*com',
				teamId: RandomString.generate(10),
				teamName: RandomString.generate(10),
				channelId: RandomString.generate(10),
				channelName: RandomString.generate(10),
				postId: RandomString.generate(10)
			},
			{
				createdAt: Date.now(),
				providerId: 'login*microsoft*com',
				teamId: RandomString.generate(10),
				teamName: RandomString.generate(10),
				channelId: RandomString.generate(10),
				channelName: RandomString.generate(10),
				postId: RandomString.generate(10)
			}
		];
	}

	getShareIdentifiers (sharedTo) {
		const providerMap = {
			'slack*com': 'slack',
			'login*microsoft*com': 'msteams'
		};
		return sharedTo.map(dest => [
			providerMap[dest.providerId],
			dest.teamId,
			dest.channelId,
			dest.postId
		].join('::'));
	}

	// perform the actual post update 
	// the actual test is reading the post and verifying it is correct
	updatePost (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/posts/' + this.post.id,
				data: this.data,
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
