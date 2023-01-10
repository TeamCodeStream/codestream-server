'use strict';

const ConfirmationTest = require('./confirmation_test');
const Assert = require('assert');

class NoSubscribeToTeamChannelTest extends ConfirmationTest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 2;
		Object.assign(this.teamOptions, {
			creatorIndex: 1,
			numAdditionalInvites: 2
		});
	}

	get description () {
		return 'under one-user-per-org, a user should NOT be able to subscribe to the team channel after they confirm registration (they must accept invite first)';
	}

	getUserData () {
		const data = this.userFactory.getRandomUserData();
		data.email = this.users[3].user.email;
		return data;
	}

	run (callback) {
		super.run(error => {
			if (error) { return callback(error); }
			this.trySubscribeToTeam(callback);
		});''
	}

	trySubscribeToTeam (callback) {
		(async () => {
			try {
				await this.broadcasterClient.subscribe(
					`team-${this.team.id}`,
					() => {
						Assert.fail('message received on team channel');
					}
				);
				Assert.fail('subscription to team channel was successful');
			} 
			catch (error) {
				callback();
			}
		})();
	}
}

module.exports = NoSubscribeToTeamChannelTest;

