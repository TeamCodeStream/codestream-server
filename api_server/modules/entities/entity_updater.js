// this class should be used to update entity documents in the database

'use strict';

const ModelUpdater = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_updater');
const Entity = require('./entity');

class EntityUpdater extends ModelUpdater {

	get modelClass () {
		return Entity;	// class to use to create an entity model
	}

	get collectionName () {
		return 'entities';	// data collection to use
	}

	// convenience wrapper
	async updateEntity (id, attributes) {
		return await this.updateModel(id, attributes);
	}

	// get attributes that are allowed, we will ignore all others
	getAllowedAttributes () {
		return {
			string: ['lastUserId'],
		};
	}

	// called before the entity is actually saved
	async preSave () {
		this.attributes.modifiedAt = this.attributes.lastUpdated = Date.now();
		await super.preSave();	// base-class preSave
	}
}

module.exports = EntityUpdater;
