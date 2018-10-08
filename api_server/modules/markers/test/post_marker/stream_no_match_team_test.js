'use strict';

const PostMarkerTest = require('./post_marker_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class StreamNoMatchTeamTest extends PostMarkerTest {

	get description () {
		return 'should return an error when trying to create a marker referencing a stream that doesn\'t match the given team';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011'
		};
	}

	before (callback) {
		BoundAsync.series(this, [
			this.createOtherRepo,
			super.before
		], callback);
	}

	createOtherRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherTeam = response.team;
				callback();
			},
			{
				token: this.token
			}
		);
	}

	// form the data for the marker we'll create in the test
	makeMarkerData (callback) {
		// substitute the ID of the second team
		super.makeMarkerData(() => {
			this.data.teamId = this.otherTeam._id;
			callback();
		});
	}

}

module.exports = StreamNoMatchTeamTest;
