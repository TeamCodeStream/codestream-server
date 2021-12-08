'use strict';

const RelateCodemarkTest = require('./relate_codemark_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class DifferentTeamTest extends RelateCodemarkTest {

	get description () {
		return 'should return an error when trying to relate codemarks from different teams';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'codemarks must be from the same team'
		};
	}

	makeCodemarks (callback) {
		// make a second team, with both users as members, before creating the codemarks
		this.secondCodemarkInOtherTeam = true;
		BoundAsync.series(this, [
			this.makeOtherTeam,
			this.inviteCurrentUser,
			super.makeCodemarks
		], callback);
	}

	makeOtherTeam (callback) {
		this.companyFactory.createRandomCompany((error, response) => {
			if (error) { return callback(error); }
			this.otherTeam = response.team;
			callback();
		}, { token: this.users[1].accessToken });
	}

	inviteCurrentUser (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/users',
				data: {
					teamId: this.otherTeam.id,
					email: this.currentUser.user.email
				},
				token: this.users[1].accessToken
			},
			callback
		);
	}
}

module.exports = DifferentTeamTest;
