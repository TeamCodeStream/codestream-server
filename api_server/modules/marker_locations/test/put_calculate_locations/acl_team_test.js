'use strict';

var PutCalculateLocationsTest = require('./put_calculate_locations_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class ACLTeamTest extends PutCalculateLocationsTest {

	get description () {
		return 'should return error when attempting to calculate marker locations for a stream from a team i am not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'	// updateAuth
		};
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,		// run the usual test of putting marker locations
			this.createOtherRepo,	// create another repo as the other user, i won't be included in the team for this repo
			this.createOtherStream	// create a stream in this repo
		], callback);
	}

	// create a repo as another user, i won't be included
	createOtherRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherRepo = response.repo;
				callback();
			},
			{
				token: this.teamCreatorData.accessToken	// team creator creates another repo and team
			}
		);
	}

	// create a file stream in the other repo we created, i don't have access rights to this since
	// i'm not in the team
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
				token: this.teamCreatorData.accessToken // team creator can create this stream too
			}
		);
	}
}

module.exports = ACLTeamTest;
