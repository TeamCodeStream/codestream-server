'use strict';

const PutUserTest = require('./put_user_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const TestTeamCreator = require(process.env.CS_API_TOP + '/lib/test_base/test_team_creator');

class UsernameNotUniqueForSecondTeamTest extends PutUserTest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 3;
	}

	get description () {
		return 'should return an error when user is trying to update their username and it is not unique for a second team';
	}

	getExpectedError () {
		return {
			code: 'TEAM-1000'
		};
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,			// set up usual test conditions
			this.createSecondTeam,	// create a second team, with the third user on it
			this.inviteCurrentUser
		], callback);
	}

	// create a second team to use for the test
	createSecondTeam (callback) {
		new TestTeamCreator({
			test: this,
			userOptions: this.userOptions,
			teamOptions: Object.assign({}, this.teamOptions, {
				creatorToken: this.users[2].accessToken
			})
		}).create((error, response) => {
			if (error) { return callback(error); }
			this.secondTeam = response.team;
			this.data.username = this.users[2].user.username;
			callback();
		});
	}

	inviteCurrentUser (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/users',
				data: {
					email: this.currentUser.user.email,
					teamId: this.secondTeam.id
				},
				token: this.users[2].accessToken
			},
			callback
		);
	}
}

module.exports = UsernameNotUniqueForSecondTeamTest;
