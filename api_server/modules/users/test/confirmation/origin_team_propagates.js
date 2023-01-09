'use strict';

const JoinMethodTest = require('./join_method_test');
const Assert = require('assert');

class OriginTeamPropagates extends JoinMethodTest {

	constructor (options) {
		super(options);
		this.teamOptions.preCreateTeam = this.createOriginTeam;
	}

	get description () {
		return 'the user should inherit origin team ID from the team creator when confirming registration and already on a team';
	}

	createOriginTeam (teamCreator, callback) {
		return callback();
		const token = teamCreator.users[this.teamOptions.creatorIndex].accessToken;
		this.companyFactory.createRandomCompany(
			(error, response) => {
				if (error) { return callback(error); }
				this.originTeam = response.team;
				callback();
			},
			{
				token
			}
		);
	}

	validateResponse (data) {
		console.log('NOTE: under one-user-per-org, originTeam is not set on confirmation, this test can probably be retired');
	}
}

module.exports = OriginTeamPropagates;
