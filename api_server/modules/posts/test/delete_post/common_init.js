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
			this.setExpectedData
		], callback);
	}

	setTestOptions (callback) {
		this.teamOptions.creatorIndex = 1;
		this.userOptions.numRegistered = 2;
		this.streamOptions.creatorIndex = 1;
		this.streamOptions.type = this.streamType || 'channel';
		this.postOptions.creatorIndex = 0;
		if (this.streamType === 'file') {
			this.repoOptions.creatorIndex = 1;
		}
		callback();
	}

	setExpectedData (callback) {
		this.post = this.postData[this.testPost].post;
		this.expectedData = {
			post: {
				_id: this.post._id,
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
			}
		};
		if (this.postOptions.wantCodeBlock) {
			this.expectedData.markers = [{
				_id: this.postData[0].markers[0]._id,
				$set: {
					deactivated: true,
					version: 2
				},
				$version: {
					before: 1,
					after: 2
				}
			}];
		}
		this.expectedPost = DeepClone(this.post);
		Object.assign(this.expectedPost, this.expectedData.post.$set);
		this.path = '/posts/' + this.post._id;
		this.modifiedAfter = Date.now();
		callback();
	}

	deletePost (callback) {
		this.doApiRequest(
			{
				method: 'delete',
				path: '/posts/' + this.post._id,
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
