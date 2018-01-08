'use strict';

var GetMarkersTest = require('./get_markers_test');

class ACLTeamTest extends GetMarkersTest {

	constructor (options) {
		super(options);
		this.withoutMe = true;	// we'll create the setup team without the current user
	}

	get description () {
		return 'should return an error when trying to fetch markers from a stream in a team i\'m not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'	// readAuth
		};
	}
}

module.exports = ACLTeamTest;
