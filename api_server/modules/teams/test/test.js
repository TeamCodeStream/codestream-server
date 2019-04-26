// handle unit tests for the teams module

'use strict';

// make eslint happy
/* globals describe */

const ProviderHostRequestTester = require('./provider_host/test');

const TeamsRequestTester = require('./teams_request_tester');

const teamsRequestTester = new TeamsRequestTester();

describe('team requests', function() {

	this.timeout(20000);

	describe('GET /teams/:id', teamsRequestTester.getTeamTest);
	describe('GET /teams', teamsRequestTester.getTeamsTest);
	describe('POST /teams', teamsRequestTester.postTeamTest);
	describe('PUT /teams/:id', teamsRequestTester.putTeamTest);
	describe('PUT /team-settings/:id', teamsRequestTester.putTeamSettingsTest);
	describe('PUT /provider-host/:provider/:teamId', ProviderHostRequestTester.test);
});
