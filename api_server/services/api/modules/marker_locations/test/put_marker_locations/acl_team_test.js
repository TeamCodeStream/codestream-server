'use strict';

var PutMarkerLocationsTest = require('./put_marker_locations_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class ACLTeamTest extends PutMarkerLocationsTest {

	get description () {
		return 'should return error when attempting to put marker locations for a stream from a team i am not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'
		};
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createOtherRepo,
			this.createOtherStream
		], callback);
	}

	createOtherRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherRepo = response.repo;
				callback();
			},
			{
				token: this.otherUserData.accessToken
			}
		);
	}

	createOtherStream (callback) {
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.data.streamId = response.stream._id;
				callback();
			},
			{
				type: 'file',
				teamId: this.otherRepo.teamId,
				repoId: this.otherRepo._id,
				token: this.otherUserData.accessToken
			}
		);
	}
}

module.exports = ACLTeamTest;
