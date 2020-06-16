// this class should be used to delete team documents in the database

'use strict';

const ModelDeleter = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_deleter');

class TeamDeleter extends ModelDeleter {

	get collectionName () {
		return 'teams';	// data collection to use
	}

	// convenience wrapper
	async deleteTeam (id) {
		return await this.deleteModel(id);
	}

	// set the actual op to execute to delete an op 
	async setOpForDelete () {
		// get the team to delete
		this.teamToDelete = await this.data.teams.getById(this.request.request.params.id);
		if (!this.teamToDelete) {
			throw this.errorHandler.error('notFound', { info: 'team' });
		}

		// change the team's name to indicate this is a deactivated team
		super.setOpForDelete();
		const name = this.teamToDelete.get('name');
		const now = Date.now();
		this.deleteOp.$set.name = `${name}-deactivated${now}`;
		this.deleteOp.$set.modifiedAt = Date.now();
	}
}

module.exports = TeamDeleter;
