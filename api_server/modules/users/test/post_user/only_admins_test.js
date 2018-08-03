'use strict';

const PostUserTest = require('./post_user_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class OnlyAdminsTest extends PostUserTest {

	constructor (options) {
		super(options);
		this.wantOtherUser = true;
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
				path: '/team-settings/' + this.team._id,
				data: {
					onlyAdminsCanInvite: true
				},
				token: this.teamCreatorData.accessToken
			},
			callback
		);
	}
}

module.exports = OnlyAdminsTest;
