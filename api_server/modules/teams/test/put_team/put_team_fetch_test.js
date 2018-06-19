'use strict';

const PutTeamTest = require('./put_team_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Assert = require('assert');
const TeamTestConstants = require('../team_test_constants');

class PutTeamFetchTest extends PutTeamTest {

	get description () {
		return 'should properly update a team when requested, checked by fetching the team';
	}

	get method () {
		return 'get';
	}

	getExpectedFields () {
		return { team: TeamTestConstants.EXPECTED_TEAM_FIELDS };
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,	// do the usual test prep
			this.updateTeam	// perform the actual update
		], callback);
	}

	// perform the actual team update 
	// the actual test is reading the team and verifying it is correct
	updateTeam (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/teams/' + this.team._id,
				data: this.data,
				token: this.token
			},
			(error, response) => {
                if (error) { return callback(error); }
				Object.assign(this.expectedTeam, response.team, this.data);
				delete this.data;	// don't need this anymore
				callback();
			}
		);
	}

	// validate that the response is correct
	validateResponse (data) {
        // verify what we fetch is what we got back in the response
        data.team.memberIds.sort();
        this.expectedTeam.memberIds.sort();
		Assert.deepEqual(data.team, this.expectedTeam, 'fetched team does not match');
	}
}

module.exports = PutTeamFetchTest;
