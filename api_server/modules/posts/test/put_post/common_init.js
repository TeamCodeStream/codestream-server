// base class for many tests of the "PUT /posts" requests

'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const DeepClone = require(process.env.CS_API_TOP + '/server_utils/deep_clone');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

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
		if (this.streamType === 'file') {
			this.repoOptions.creatorIndex = 1;
		}
		callback();
	}

	// form the data for the post update
	makePostData (callback) {
		this.post = this.postData[0].post;
		this.data = {
			text: this.postFactory.randomText()
		};
		if (this.wantMention) {
			this.data.mentionedUserIds = [this.users[1].user._id];
		}
		this.expectedData = {
			post: {
				_id: this.post._id,
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
		this.expectedPost = DeepClone(this.post);
		Object.assign(this.expectedPost, this.expectedData.post.$set);
		this.path = '/posts/' + this.post._id;
		this.modifiedAfter = Date.now();
		callback();
	}

	// perform the actual post update 
	// the actual test is reading the post and verifying it is correct
	updatePost (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/posts/' + this.post._id,
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
