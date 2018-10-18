'use strict';

const GetMarkerLocationsTest = require('./get_marker_locations_test');

class ACLTeamTest extends GetMarkerLocationsTest {

	constructor (options) {
		super(options);
		this.teamOptions.members = []; // we'll create the setup team without the current user
	}

	get description () {
		return 'should return an error when trying to fetch marker locations from a stream in a team i\'m not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'	// readAuth
		};
	}
}

module.exports = ACLTeamTest;
