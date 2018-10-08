'use strict';

const PostMarkerTest = require('./post_marker_test');
const ObjectID = require('mongodb').ObjectID;

class TeamNotFoundTest extends PostMarkerTest {

	get description () {
		return 'should return an error when trying to create a marker in a team that doesn\'t exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011'
		};
	}

	// form the data for the marker we'll create in the test
	makeMarkerData (callback) {
		// substitute an invalid ID for the team ID
		super.makeMarkerData(() => {
			this.data.teamId = ObjectID();
			callback();
		});
	}
}

module.exports = TeamNotFoundTest;
