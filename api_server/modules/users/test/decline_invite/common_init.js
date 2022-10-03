// base class for many tests of the "PUT /decline-invite/:companyId" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const Assert = require('assert');

class CommonInit {

	init (callback) {
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.setPath,
			this.inviteUser
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
		this.path = `/decline-invite/${this.company.id}`;
		callback();
	}

	// invite the current user to join the company
	inviteUser (callback) {
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
			(error, response) => {
				if (error) { return callback(error); }
				this.invitedUser = response.user;
				this.declinedAfter = Date.now();

				const emailParts = this.currentUser.user.email.split('@');
				this.expectedData = {
					user: {
						id: this.invitedUser.id,
						_id: this.invitedUser.id,
						$set: {
							deactivated: true,
							modifiedAt: Date.now(),
							version: 2,
							email: `${emailParts[0]}-deactivated${Date.now()}@${emailParts[1]}`
						},
						$version: {
							before: 1, 
							after: 2
						}
					}
				};
		
				callback();
			}
		);
	}

	// do the actual decline of the invitation
	declineInvite (callback) {
		this.declinedAfter = Date.now();
		this.doApiRequest(
			{
				method: 'put',
				path: '/decline-invite/' + this.company.id,
				token: this.token
			},
			callback
		);
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert(data.user.$set.modifiedAt >= this.declinedAfter, 'modifiedAt not set to after the invite declination');
		this.expectedData.user.$set.modifiedAt = data.user.$set.modifiedAt;

		const match = data.user.$set.email.match(/^.+-deactivated[0-9]+?@.+$/);
		Assert(match, 'user email not updated properly');
		this.expectedData.user.$set.email = data.user.$set.email;

		Assert.deepStrictEqual(data, this.expectedData, 'incorrect response');
	}
}

module.exports = CommonInit;
