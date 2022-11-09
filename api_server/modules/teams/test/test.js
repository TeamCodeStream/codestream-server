// handle unit tests for the teams module

'use strict';

// make eslint happy
/* globals describe */

const TeamsRequestTester = require('./teams_request_tester');
const teamsRequestTester = new TeamsRequestTester();
const CreateTagRequestTester = require('./create_tag/test');
const UpdateTagRequestTester = require('./update_tag/test');
const DeleteTagRequestTester = require('./delete_tag/test');
const AddBlameMapRequestTester = require('./add_blame_map/test');
const DeleteBlameMapRequestTester = require('./delete_blame_map/test');
const GetAuthSettingsRequestTester = require('./get_auth_settings/test');

describe('team requests', function() {

	this.timeout(20000);

	/*
	describe('GET /teams/:id', teamsRequestTester.getTeamTest);
	describe('GET /teams', teamsRequestTester.getTeamsTest);
	describe('POST /teams', teamsRequestTester.postTeamTest);
	*/
	describe('PUT /teams/:id', teamsRequestTester.putTeamTest);
	/*
	describe('PUT /team-settings/:id', teamsRequestTester.putTeamSettingsTest);
	describe('POST /team-tags/:id', CreateTagRequestTester.test);
	describe('PUT /team-tags/:teamId/:id', UpdateTagRequestTester.test);
	describe('DELETE /team-tags/:teamId/:id', DeleteTagRequestTester.test);
	describe('POST /add-blame-map/:teamId', AddBlameMapRequestTester.test);
	describe('PUT /delete-blame-map/:teamId', DeleteBlameMapRequestTester.test);
	describe('GET /no-auth/teams/:teamId/auth-settings', GetAuthSettingsRequestTester.test);
	*/
});
