// base class for many tests of the "PUT /codemarks/follow/:id" requests

'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const DeepClone = require(process.env.CS_API_TOP + '/server_utils/deep_clone');

class CommonInit {

	init (callback) {
		this.teamOptions.creatorIndex = 1;
		this.streamOptions.creatorIndex = 1;
		this.streamOptions.type = this.streamType || 'channel';
		this.streamOptions.isTeamStream = this.isTeamStream || false;
		Object.assign(this.postOptions, {
			numPosts: 1,
			creatorIndex: 1,
			wantCodemark: true,
			wantMarker: true
		});

		BoundAsync.series(this, [
			CodeStreamAPITest.prototype.before.bind(this),
			this.makeTestData		// make the data to use when issuing the test request
		], callback);
	}

	// make the data to use when issuing the test request
	makeTestData (callback) {
		this.codemark = this.postData[0].codemark;
		this.expectedResponse = {
			codemark: {
				_id: this.codemark.id,	// DEPRECATE ME
				id: this.codemark.id,
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
		this.path = `/codemarks/follow/${this.codemark.id}`;
		this.expectedCodemark = DeepClone(this.codemark);
		Object.assign(this.expectedCodemark, this.expectedResponse.codemark.$set);
		this.expectedCodemark.followerIds = [this.currentUser.user.id];
		callback();
	}

	// perform the actual follow
	followCodemark (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: `/codemarks/follow/${this.codemark.id}`,
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
