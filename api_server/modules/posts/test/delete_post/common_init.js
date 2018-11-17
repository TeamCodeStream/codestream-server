// base class for many tests of the "PUT /posts" requests

'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const DeepClone = require(process.env.CS_API_TOP + '/server_utils/deep_clone');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class CommonInit {

	init (callback) {
		this.testPost = 0;
		this.expectedVersion = 2;
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.setExpectedData,
			this.setPath
		], callback);
	}

	setTestOptions (callback) {
		this.teamOptions.creatorIndex = 1;
		this.userOptions.numRegistered = 2;
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
		this.postOptions.creatorIndex = 0;
		callback();
	}

	setExpectedData (callback) {
		this.post = this.postData[this.testPost].post;
		this.expectedData = {
			posts: [{
				_id: this.post.id,	// DEPRECATE ME
				id: this.post.id,
				$set: { 
					version: this.expectedVersion,
					deactivated: true,
					text: 'this post has been deleted',
					modifiedAt: Date.now()	// placeholder
				},
				$version: {
					before: this.expectedVersion - 1,
					after: this.expectedVersion
				}
			}]
		};
		this.expectedPost = DeepClone(this.post);
		Object.assign(this.expectedPost, this.expectedData.posts[0].$set);
		this.modifiedAfter = Date.now();
		callback();
	}

	setPath (callback) {
		this.path = '/posts/' + this.post.id;
		callback();
	}

	deletePost (callback) {
		this.doApiRequest(
			{
				method: 'delete',
				path: '/posts/' + this.post.id,
				data: null,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.message = response;
				callback();
			}
		);
	}
}

module.exports = CommonInit;
