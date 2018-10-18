'use strict';

const PutMarkerLocationsTest = require('./put_marker_locations_test');

class ACLTeamTest extends PutMarkerLocationsTest {

	constructor (options) {
		super(options);
		this.teamOptions.members = []; // we'll create the setup team without the current user
	}

	get description () {
		return 'should return error when attempting to put marker locations for a stream from a team i am not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'	// updateAuth
		};
	}

}

module.exports = ACLTeamTest;
