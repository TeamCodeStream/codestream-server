'use strict';

// make jshint happy
/* globals describe */

var TeamsRequestTester = require('./teams_request_tester');

var teamsRequestTester = new TeamsRequestTester();

describe('team requests', function() {

	this.timeout(10000);

	describe('GET /teams/:id', teamsRequestTester.getTeamTest);
	describe('GET /teams', teamsRequestTester.getTeamsTest);

});
