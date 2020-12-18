'use strict';

const MessageTest = require('./message_test');

class OtherTeamMessageTest extends MessageTest {

	get description () {
		return 'when updating company test groups, all teams in the company should receive the update message';
	}

	// before the test runs...
	init (callback) {
		super.init(error => {
			if (error) { return callback(error); }

			// make another team in the same company
			this.doApiRequest(
				{
					method: 'post',
					path: '/teams',
					data: {
						companyId: this.company.id,
						name: this.teamFactory.randomName()
					},
					token: this.token
				},
				(error, response) => {
					if (error) { return callback(error); }
					this.otherTeam = response.team;
					callback();
				}
			);
		});
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		this.channelName = `team-${this.otherTeam.id}`;
		callback();
	}
}

module.exports = OtherTeamMessageTest;
