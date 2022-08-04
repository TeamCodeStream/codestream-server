'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');
const Assert = require('assert');
const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const UserTestConstants = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/test/user_test_constants');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const DetermineCapabilities = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/versioner/determine_capabilities');

class ProviderConnectTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return `should successfully create a new user and new team, returning login info, when connecting to ${this.provider}`;
	}

	get method () {
		return 'put';
	}

	get path () {
		return `/no-auth/provider-connect/${this.provider}`;
	}

	getExpectedFields () {
		const expectedResponse = { ...UserTestConstants.EXPECTED_LOGIN_RESPONSE };
		if (this.usingSocketCluster) {
			delete expectedResponse.pubnubKey;
		}
		return expectedResponse;
	}

	dontWantToken () {
		return true;
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.setApiRequestOptions,
			this.init,
			this.determineExpectedCapabilities
		], callback);
	}

	setApiRequestOptions (callback) {
		this.apiRequestOptions = {
			headers: {
				'X-CS-Plugin-IDE': 'webclient'
			}
		};
		callback();
	}

	determineExpectedCapabilities (callback) {
		(async () => {
			this.expectedCapabilities = await DetermineCapabilities({ config: this.apiConfig });
			callback();
		})();
	}

	/* eslint complexity: 0 */
	// validate the response to the test request
	validateResponse (data) {
		this.validateUser(data);
		this.validateTeam(data);
	}

	// validate that we got the correct response in the user object
	validateUser (data) {
		const user = data.user;
		const team = data.teams[0];
		const company = data.companies[0];
		const providerInfo = data.user.providerInfo;
		const errors = [];
		const joinMethod = this.wantPreExistingTeam ? 'Added to Team' : 'Created Team';
		const primaryReferral = this.wantPreExistingTeam ? 'internal' : 'external';
		let signupStatus;
		if (!this.wantPreExistingTeam) {
			signupStatus = 'teamCreated';
		}
		else if (!this.wantPreExistingConnectedUser && !this.wantPreExistingUnconnectedUser) {
			signupStatus = 'userCreated';
		}
		else {
			signupStatus = 'signedIn';
		}
		Assert.equal(data.signupStatus, signupStatus, 'signupStatus is not correct, should be ' + signupStatus);
		const result = (
			((user.id === user._id) || errors.push('id not set to _id')) && 	// DEPRECATE ME
			(user.email || errors.push('no email')) &&
			(user.username || errors.push('username not set')) &&
			(user.fullName || errors.push('full name not set')) &&
			(user.timeZone || errors.push('time zone not set')) &&
			((user.lastLogin || 0) <= this.beforeLogin || errors.push('last login time was set but should not have been')) && 
			((user.firstSessionStartedAt === undefined) || errors.push('firstSessionStartedAt should not have been set')) && 
			((user.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof user.createdAt === 'number') || errors.push('createdAt not number')) &&
			((user.modifiedAt >= user.createdAt) || errors.push('modifiedAt not greater than or equal to createdAt')) &&
			((user.creatorId === user.id) || errors.push('creatorId not equal to id')) &&
			((user.joinMethod === joinMethod) || errors.push('joinMethod not set to "Created Team"')) &&
			((user.primaryReferral === primaryReferral) || errors.push('primaryReferral not set to "internal"')) &&
			((user.originTeamId === team.id) || errors.push('originTeamId not set to ID of created team')) &&
			((user.isRegistered === true) || errors.push('isRegistered not true')) &&
			((user.registeredAt >= user.createdAt) || errors.push('registeredAt not greater than or equal to createAt')) &&
			(providerInfo[team.id][this.provider].userId || errors.push('providerInfo.userId not set for provider')) &&
			(providerInfo[team.id][this.provider].teamId || errors.push('providerInfo.teamId not set for provider')) &&
			(!!providerInfo[team.id][this.provider].accessToken || errors.push('providerInfo.accessToken not set for provider'))
		);
		Assert(result === true && errors.length === 0, 'user in response not valid: ' + errors.join(', '));
		Assert.deepEqual(user.teamIds, [team.id], 'teamIds not set to team created');
		Assert.deepEqual(user.companyIds, [company.id], 'companyIds not set to company created');
		Assert.deepEqual(user.providerIdentities, [`${this.provider}::${providerInfo[team.id][this.provider].userId}`], 'providerIdentities is not correct');
		Assert(data.accessToken, 'no access token');
		Assert(this.usingSocketCluster || data.pubnubKey, 'no pubnub key');
		Assert(data.broadcasterToken, 'no broadcaster token');
		Assert.deepEqual(data.capabilities, this.expectedCapabilities, 'capabilities are incorrect');
		if (this.preExistingUnconnectedUser) {
			Assert(!user.phoneNumber, 'phone number is set');
			Assert(!user.iWorkOn, 'iWorkOn is set');
		}
		else {
			Assert(user.phoneNumber, 'phone number is not set');
			Assert(user.iWorkOn, 'iWorkOn is not set');
		}
		// verify we got no attributes that clients shouldn't see
		this.validateSanitized(user, UserTestConstants.UNSANITIZED_ATTRIBUTES_FOR_ME);
	}

	// validate that we got the correct response in the created team
	validateTeam (data) {
		const user = data.user;
		const team = data.teams[0];
		const company = data.companies[0];
		const providerInfo = team.providerInfo;
		const creatorId = this.wantPreExistingTeam ? this.preExistingTeamCreator.id : user.id;
		const errors = [];
		const result = (
			((team.id === team._id) || errors.push('id not set to _id')) && 	// DEPRECATE ME
			((team.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof team.createdAt === 'number') || errors.push('createdAt not number')) &&
			((team.modifiedAt >= team.createdAt) || errors.push('modifiedAt not greater than or equal to createdAt')) &&
			((team.creatorId === creatorId) || errors.push('creatorId not equal to id')) &&
			(team.name || errors.push('no name for team')) &&
			((team.primaryReferral === 'external') || errors.push('primaryReferral not set to "external"')) &&
			((team.companyId === company.id) || errors.push('team companyId not set to ID of company created')) &&
			(!!providerInfo[this.provider].teamId || errors.push('teamId not set for provider'))
		);
		Assert(result === true && errors.length === 0, 'team in response not valid: ' + errors.join(', '));

		const memberIds = [user.id];
		if (this.wantPreExistingTeam) {
			memberIds.push(this.preExistingTeamCreator.id);
		}
		memberIds.sort();
		team.memberIds.sort();
		Assert.deepEqual(team.memberIds, memberIds, 'team memberIds not set to signed in user');

		Assert.deepEqual(team.adminIds, [creatorId], 'team adminIds not set to team creator');
	}
}

module.exports = ProviderConnectTest;
