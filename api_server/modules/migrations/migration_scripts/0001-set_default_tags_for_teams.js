'use strict';

const Migration = require('./migration');
const DefaultTags = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/default_tags');

class DefaultTagsForTeams extends Migration {

	get description () {
		return 'Setting default tags for teams';
	}

	async execute () {
		await this.data.teams.updateDirect(
			{},
			{ $set: { tags: DefaultTags } }
		);
	}

	async verify () {
		const teams = await this.data.teams.getByQuery(
			{ tags: { $exists: false } },
			{ overrideHintRequired: true }
		);
		if (teams.length > 0) {
			throw 'team with tags found';
		}
	}
}

module.exports = DefaultTagsForTeams;