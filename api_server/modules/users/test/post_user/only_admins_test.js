'use strict';

const PostUserTest = require('./post_user_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class OnlyAdminsTest extends PostUserTest {

	setOptions () {
		super.setOptions();
		this.teamOptions.creatorIndex = 1;
	}

	get description () {
		return 'should return an error when the team is set so that only admins can invite users and the current user is not an admin';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011'
		};
	}

	// before the test runs...
	before (callback) {
		// run the usual setup, but also make it so that only admins are allowed to invite users
		BoundAsync.series(this, [
			super.before,
			this.setTeamToAdminOnlyInvites
		], callback);
	}

	// update the team's settings so that only admins can invite users
	setTeamToAdminOnlyInvites (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/team-settings/' + this.team.id,
				data: {
					onlyAdminsCanInvite: true
				},
				token: this.users[1].accessToken
			},
			callback
		);
	}
}

module.exports = OnlyAdminsTest;
