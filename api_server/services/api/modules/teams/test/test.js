'use strict';

// make jshint happy
/* globals describe */

var Teams_Request_Tester = require('./teams_request_tester');

var teams_request_tester = new Teams_Request_Tester();

describe('team requests', function() {

	this.timeout(10000);

	describe('GET /teams/:id', teams_request_tester.get_team_test);
	describe('GET /teams', teams_request_tester.get_teams_test);

});
