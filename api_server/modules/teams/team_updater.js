// this class should be used to update team documents in the database

'use strict';

const ModelUpdater = require(process.env.CS_API_TOP + '/lib/util/restful/model_updater');
const Team = require('./team');

class TeamUpdater extends ModelUpdater {

	get modelClass () {
		return Team;	// class to use to create a team model
	}

	get collectionName () {
		return 'teams';	// data collection to use
	}

	// convenience wrapper
	async updateTeam (id, attributes) {
		return await this.updateModel(id, attributes);
	}

	// get attributes that are allowed, we will ignore all others
	getAllowedAttributes () {
		return {
			string: ['name']
		};
	}

	// before the team info gets saved...
	async preSave () {
		this.attributes.modifiedAt = Date.now();
		await super.preSave();
	}
}

module.exports = TeamUpdater;
