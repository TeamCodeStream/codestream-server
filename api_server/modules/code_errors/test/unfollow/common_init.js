// base class for many tests of the "PUT /code-errors/unfollow/:id" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');

class CommonInit {

	init (callback) {
		this.teamOptions.creatorIndex = 1;
		/*
		this.streamOptions.creatorIndex = 1;
		this.streamOptions.type = this.streamType || 'channel';
		this.streamOptions.isTeamStream = this.isTeamStream || false;
		*/
		Object.assign(this.postOptions, {
			numPosts: 1,
			creatorIndex: 1,
			wantCodeError: true
		});

		BoundAsync.series(this, [
			CodeStreamAPITest.prototype.before.bind(this),
			this.followCodeError,	// first follow the code error
			this.makeTestData		// make the data to use when issuing the test request
		], callback);
	}

	// follow the code error so we can unfollow in the test
	followCodeError (callback) {
		this.codeError = this.postData[0].codeError;
		if (this.skipFollow) { return callback(); }
		this.doApiRequest(
			{
				method: 'put',
				path: `/code-errors/follow/${this.codeError.id}`,
				token: this.currentUser.accessToken
			},
			callback
		);
	}

	// make the data to use when issuing the test request
	makeTestData (callback) {
		this.expectedResponse = {
			codeError: {
				_id: this.codeError.id,	// DEPRECATE ME
				id: this.codeError.id,
				$set: {
					version: this.expectedVersion,
					modifiedAt: Date.now() // placeholder
				},
				$pull: {
					followerIds: this.currentUser.user.id
				},
				$version: {
					before: this.expectedVersion - 1,
					after: this.expectedVersion
				}
			}
		};
		this.modifiedAfter = Date.now();
		this.path = `/code-errors/unfollow/${this.codeError.id}`;
		this.expectedCodeError = DeepClone(this.codeError);
		Object.assign(this.expectedCodeError, this.expectedResponse.codeError.$set);
		this.expectedCodeError.followerIds = [this.users[1].user.id];
		callback();
	}

	// perform the actual unfollow
	unfollowCodeError (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: `/code-errors/unfollow/${this.codeError.id}`,
				token: this.currentUser.accessToken
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
