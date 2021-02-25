'use strict';

const Migration = require('./migration');
const UserIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/indexes');

const ThrottleTime = 100;

// wait this number of milliseconds
const Wait = function (time) {
	return new Promise(resolve => {
		setTimeout(resolve, time);
	});
};

class FillLastPostCreatedAt extends Migration {

	get description () {
		return 'Filling lastPostCreatedAt for teams';
	}

	async execute () {
		const result = await this.data.teams.getByQuery({}, {
			stream: true,
			overrideHintRequired: true,
			sort: { _id: 1 },
			fields: ['_id']
		});

		let team;
		do {
			team = await result.next();
			if (team) {
				await this.processTeam(team);
				await Wait(ThrottleTime);
			}
		} while (team);
		result.done();
	}

	async processTeam (team) {
		const mostRecentUser = await this.data.users.getOneByQuery(
			{
				teamIds: team.id 
			},
			{
				hint: UserIndexes.byTeamId,
				sort: { lastPostCreatedAt: -1 },
				fields: ['lastPostCreatedAt']
			}
		);
		if (mostRecentUser && mostRecentUser.lastPostCreatedAt) {
			this.log(`Setting lastPostCreatedAt for team ${team.id}...`);
			await this.data.teams.updateDirect(
				{ id: this.data.teams.objectIdSafe(team.id) },
				{ $set: { lastPostCreatedAt: mostRecentUser.lastPostCreatedAt } }
			);
		}
	}

	async verify () {
	}
}

module.exports = FillLastPostCreatedAt;