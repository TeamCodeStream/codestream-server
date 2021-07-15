// base class for many tests of the "PUT /code-errors/follow/:id" requests

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
		this.repoOptions.creatorIndex = 1;
		Object.assign(this.postOptions, {
			numPosts: 1,
			creatorIndex: 1,
			wantCodeError: true,
			wantMarkers: 2
		});

		BoundAsync.series(this, [
			CodeStreamAPITest.prototype.before.bind(this),
			this.makeTestData		// make the data to use when issuing the test request
		], callback);
	}

	// make the data to use when issuing the test request
	makeTestData (callback) {
		this.codeError = this.postData[0].codeError;
		this.expectedResponse = {
			codeError: {
				_id: this.codeError.id,	// DEPRECATE ME
				id: this.codeError.id,
				$set: {
					version: this.expectedVersion,
					modifiedAt: Date.now() // placeholder
				},
				$addToSet: {
					followerIds: this.currentUser.user.id
				},
				$version: {
					before: this.expectedVersion - 1,
					after: this.expectedVersion
				}

			}
		};
		this.modifiedAfter = Date.now();
		this.path = `/code-errors/follow/${this.codeError.id}`;
		this.expectedCodeError = DeepClone(this.codeError);
		Object.assign(this.expectedCodeError, this.expectedResponse.codeError.$set);
		this.expectedCodeError.followerIds = [this.users[1].user.id, this.currentUser.user.id];
		callback();
	}

	// perform the actual follow
	followCodeError (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: `/code-errors/follow/${this.codeError.id}`,
				token: this.users[1].accessToken
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
