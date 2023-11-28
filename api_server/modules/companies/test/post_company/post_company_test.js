// provide a base class for many of the tests of the "POST /companies" request to create a company
'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');
const CompanyTestConstants = require('../company_test_constants');
const TeamTestConstants = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/test/team_test_constants');

class PostCompanyTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get method () {
		return 'post';
	}

	get description () {
		const unifiedIdentity = this.unifiedIdentityEnabled ? ', and linked NR info if unified identity is enabled' : '';
		return `should return userId, teamId, and accessToken when creating a new company under one-user-per-org${unifiedIdentity}`;
	}

	getExpectedFields () {
		return CompanyTestConstants.EXPECTED_COMPANY_RESPONSE;
	}

	before (callback) {
		this.init(callback);
	}

	/* eslint complexity: 0 */
	// validate the response to the test request
	validateResponse (data) {
		if (this.teamOptions.creatorIndex !== undefined && !this.expectFullResponse) {
			return this.validateOneUserPerOrgResponse(data);
		}
		
		const company = data.company;
		const team = data.team;
		const expectedName = this.expectedName || this.data.name;
		const errors = [];
		let result = (
			((company.id === company._id) || errors.push('id not set to _id')) && 	// DEPRECATE ME
			((company.name === expectedName) || errors.push('name does not match')) &&
			((company.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof company.createdAt === 'number') || errors.push('createdAt not number')) &&
			((company.modifiedAt >= company.createdAt) || errors.push('modifiedAt not greater than or equal to createdAt')) &&
			((company.creatorId === this.currentUser.user.id) || errors.push('creatorId not equal to current user id')) &&
			((company.everyoneTeamId === team.id) || errors.push('everyoneTeamId not set to the ID of the everyone team')) &&
			((team.id === team._id) || errors.push('team.id not set to team._id')) && // DEPRECATE ME
			((team.name === 'Everyone') || errors.push('team name not set to "Everyone"')) &&
			((team.isEveryoneTeam === true) || errors.push('team isEveryoneFlag not set')) &&
			((team.companyId === company.id) || errors.push('team companyId should be set to the company id'))
		);

		if (this.unifiedIdentityEnabled) {
			result &&= (
				((typeof company.linkedNROrgId === 'string') || errors.push('linkedNROrgId not set')) /*&&
				((company.codestreamOnly === true) || errors.push('codestreamOnly not set')) &&
				((company.orgOrigination === 'CS') || errors.push('orgOrigination not set'))*/
			);
		}
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));

		Assert.deepStrictEqual(company.teamIds, [team.id], 'teamIds should have single "Everyone" team');
		this.validateTeamStream(data);
		this.validateSanitized(company, CompanyTestConstants.UNSANITIZED_ATTRIBUTES);
		this.validateSanitized(team, TeamTestConstants.UNSANITIZED_ATTRIBUTES);
	}

	// validate the stream part of the response (the team stream created for the team)
	validateTeamStream (data) {
		const stream = data.streams[0];
		const errors = [];
		const result = (
			((stream.id === stream._id) || errors.push('id not set to _id')) && 	// DEPRECATE ME
			((stream.name === 'general') || errors.push('team stream name should be general')) &&
			((stream.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof stream.createdAt === 'number') || errors.push('createdAt not number')) &&
			((stream.modifiedAt >= stream.createdAt) || errors.push('modifiedAt not greater than or equal to createdAt')) &&
            ((stream.creatorId === this.currentUser.user.id) || errors.push('creatorId not equal to current user id')) &&
            ((stream.type === 'channel') || errors.push('team stream type should be channel')) &&
            ((stream.privacy === 'public') || errors.push('team stream should be public')) &&
            ((stream.isTeamStream === true) || errors.push('isTeamStream should be true'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		this.validateSanitized(stream, TeamTestConstants.UNSANITIZED_STREAM_ATTRIBUTES);
	}

	validateOneUserPerOrgResponse (data) {
		this.responseData = data;
		const { accessToken, userId, teamId } = data;
		Assert(accessToken && typeof accessToken === 'string', 'access token not returned or not string type');
		Assert(userId && typeof userId === 'string', 'user id not returned or not string type');
		Assert(userId !== this.currentUser.user.id, 'userId returned is equal to the joining user, but should represent a duplicate user object');
		Assert(teamId && typeof teamId === 'string', 'team id not returned or not string type');
		Assert(teamId !== this.team.id, 'teamId returned is equal to the original team, but should represent a duplicate object');
	}
}

module.exports = PostCompanyTest;
