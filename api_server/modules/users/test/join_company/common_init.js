// base class for many tests of the "PUT /companies/join/:id" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const Assert = require('assert');

class CommonInit {

	init (callback) {
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.setPath,
			this.prepToJoinCompany
		], callback);
	}

	setTestOptions (callback) {
		// set to use "one-user-per-org" paradigm
		// this can be removed when we have fully migrated to ONE_USER_PER_ORG
		this.oneUserPerOrg = true;
		
		// create a company and don't make the "current user" a member
		this.expectedVersion = 3;
		Object.assign(this.teamOptions, {
			creatorIndex: 1,
			members: []
		});
		callback();
	}

	setPath (callback) {
		this.path = `/join-company/${this.company.id}`;
		callback();
	}

	// prepare for the current user joining the company, either by enabling domain joining, or inviting them
	prepToJoinCompany (callback) {
		if (this.byDomainJoining) {
			this.enableDomainJoining(callback);
		} else {
			this.inviteUser(callback);
		}
	}

	// enable domain-based joining for our existing company
	enableDomainJoining (callback) {
		if (!this.byDomainJoining) { return callback(); }
		const domain = this.users[0].user.email.split('@')[1];
		this.doApiRequest(
			{
				method: 'put',
				path: '/companies/' + this.company.id,
				data: {
					domainJoining: [this.useDomain || domain]
				},
				token: this.users[1].accessToken
			},
			callback
		);
	}

	// invite the current user to join the company
	inviteUser (callback) {
		if (this.byDomainJoining) { return callback(); }
		if (this.dontInvite) { return callback(); }
		this.doApiRequest(
			{
				method: 'post',
				path: '/users',
				data: {
					email: this.currentUser.user.email,
					teamId: this.team.id
				},
				token: this.users[1].accessToken
			},
			callback
		);
	}

	// perform the actual company join 
	doJoin (callback) {
		this.joinedAfter = Date.now();
		this.doApiRequest(
			{
				method: 'put',
				path: '/join-company/' + this.company.id,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.joinResponse = response;
				this.token = response.accessToken;
				callback();
			}
		);
	}

	// validate the response to the test request
	validateResponse (data) {
		const { accessToken, userId, teamId } = data;
		Assert(accessToken && typeof accessToken === 'string', 'access token not returned or not string type');
		Assert(userId && typeof userId === 'string', 'user id not returned or not string type');
		Assert(userId !== this.currentUser.user.id, 'userId returned is equal to the joining user, but should represent a duplicate user object');
		Assert.strictEqual(teamId, this.team.id, 'teamId in response is not correct');
	}
}

module.exports = CommonInit;
