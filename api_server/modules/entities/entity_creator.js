// this class should be used to create all entity documents in the database

'use strict';

const ModelCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_creator');
const Entity = require('./entity');
const Errors = require('./errors');
const Path = require('path');

class EntityCreator extends ModelCreator {

	constructor (options) {
		super(options);
		this.errorHandler.add(Errors);
	}

	get modelClass () {
		return Entity;	// class to use to create an Entity model
	}

	get collectionName () {
		return 'entities';	// data collection to use
	}

	// convenience wrapper
	async createEntity (attributes) {
		return await this.createModel(attributes);
	}

	// get attributes that are required for entity creation, and those that are optional,
	// along with their types
	getRequiredAndOptionalAttributes () {
		return {
			required: {
				string: ['entityId', 'teamId', 'companyId']
			},
		};
	}

	// validate attributes for the entity we are creating
	async validateAttributes () {
	}

	// right before we save the model...
	async preSave () {
		this.attributes.creatorId = this.user.id;	// establish creator of the entity as originator of the request
		this.attributes.lastUserId = this.user.id;	// establish this user as the last user to "update" the entity 
		this.attributes.lastUpdated = this.attributes.createdAt = Date.now();	// establish date the entity was last "updated"
		if (this.request.isForTesting()) { // special for-testing header for easy wiping of test data
			this.attributes._forTesting = true;
		}
		this.createId();			// requisition an ID for the entity
		await super.preSave();		// proceed with the save...
	}
}

module.exports = EntityCreator;
