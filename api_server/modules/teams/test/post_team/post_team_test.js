// provide a base class for many of the tests of the "POST /teams" request to create a team
'use strict';

const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const TeamTestConstants = require('../team_test_constants');
const EmailUtilities = require(process.env.CS_API_TOP + '/server_utils/email_utilities');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const DefaultTags = require('../../default_tags');

class PostTeamTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		delete this.teamOptions.creatorIndex;
	}

	get method () {
		return 'post';
	}

	get path () {
		return '/teams';
	}

	get description () {
		return 'should return a valid team when creating a new team';
	}

	getExpectedFields () {
		return TeamTestConstants.EXPECTED_TEAM_RESPONSE;
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.makeTeamData
		], callback);
	}

	// make the data to use when issuing the request
	makeTeamData (callback) {
		this.userCompanyName = this.currentUser.companyName;
		this.data = {
			name: this.teamFactory.randomName()
		};
		callback();
	}

	/* eslint complexity: 0 */
	// validate the response to the test request
	validateResponse (data) {
		const team = data.team;
		const errors = [];
		const result = (
			((team.id === team._id) || errors.push('id not set to _id')) && 	// DEPRECATE ME
			((team.name === this.data.name) || errors.push('name does not match')) &&
			((team.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof team.createdAt === 'number') || errors.push('createdAt not number')) &&
			((team.modifiedAt >= team.createdAt) || errors.push('modifiedAt not greater than or equal to createdAt')) &&
			((team.creatorId === this.currentUser.user.id) || errors.push('creatorId not equal to current user id')) &&
			((team.memberIds.length === 1 && team.memberIds[0] === this.currentUser.user.id) || errors.push('current user is not the only member')) &&
			((team.adminIds.length === 1 && team.adminIds[0] === this.currentUser.user.id) || errors.push('current user was not made an admin')) &&
			((team.primaryReferral === (this.teamReferral || 'external')) || errors.push('primaryReferral is incorrect'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		Assert.deepEqual(team.tags, DefaultTags, 'tags not set to defaults');
		this.validateCompany(data);
		this.validateTeamStream(data);
		this.validateSanitized(team, TeamTestConstants.UNSANITIZED_ATTRIBUTES);
	}
    
	// validate the company part of the response
	validateCompany (data) {
		if (this.attachToCompany) {
			return this.validateAttachToCompany(data);
		}
		const team = data.team;
		const company = data.company;
		const companyName = 
			(
				this.data && this.data.company && this.data.company.name
			) ||
			(
				!this.teamReferral && this.currentUser.companyName
			) ||
			(
				this.userOptions && this.userOptions.wantWebmail ?
					this.currentUser.user.email :
					EmailUtilities.parseEmail(this.currentUser.user.email).domain
			);
		const errors = [];
		const result = (
			((company.id === company._id) || errors.push('id not set to _id')) && 	// DEPRECATE ME
			((company.name === companyName) || errors.push('company name not correct')) &&
			((company.id === team.companyId) || errors.push('company ID not the same as team.companyId')) &&
			((company.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof company.createdAt === 'number') || errors.push('createdAt not number')) &&
			((company.modifiedAt >= company.createdAt) || errors.push('modifiedAt not greater than or equal to createdAt')) &&
			((company.creatorId === this.currentUser.user.id) || errors.push('creatorId not equal to current user id')) &&
			((company.plan === '30DAYTRIAL') || errors.push('company plan should be set to 30DAYTRIAL')) &&
			((company.trialStartDate === company.createdAt) || errors.push('trialStartDate not set to createdAt')) &&
			((company.trialEndDate === company.createdAt + n36Days) || errors.push('trialEndDate not set to trialStartDate plus 36 days'))
		);
		Assert.deepEqual(company.teamIds, [team.id], 'company teamIds is not equal to the array of teams');
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		this.validateSanitized(company, TeamTestConstants.UNSANITIZED_COMPANY_ATTRIBUTES);
	}

	// in the case of attaching the created team to a company, validate the company update
	validateAttachToCompany (data) {
		Assert(data.company.$set.modifiedAt >= this.attachToCompany.createdAt, 'modifiedAt in updated company should be greater than or equal to the creation date of the company');
		const expectedUpdate = {
			id: this.attachToCompany.id,
			_id: this.attachToCompany._id,
			$set: {
				modifiedAt: data.company.$set.modifiedAt,
				version: 2
			},
			$addToSet: {
				teamIds: data.team.id
			},
			$version: {
				before: 1,
				after: 2
			}
		};
		Assert.deepEqual(data.company, expectedUpdate, 'update to company not correct');
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
}

module.exports = PostTeamTest;
