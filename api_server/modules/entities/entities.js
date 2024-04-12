// provide a module to handle requests associated with repos

'use strict';

const Restful = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful');
const Entity = require('./entity');
const EntityCreator = require('./entity_creator');
const Errors = require('./errors');

// expose these restful routes
const ENTITIES_STANDARD_ROUTES = {
	want: ['get', 'getMany', 'post'],
	baseRouteName: 'entities',
	requestClasses: {
		'get': require('./get_entity_request'),
		'getMany': require('./get_entities_request'),
		'post': require('./post_entity_request'),
	}
};

// expose additional routes
const ENTITIES_ADDITIONAL_ROUTES = [
];

class Entities extends Restful {

	get collectionName () {
		return 'entities';	// name of the data collection
	}

	get modelName () {
		return 'entity';	// name of the data model
	}

	get creatorClass () {
		return EntityCreator;	// use this class to instantiate entities
	}

	get modelClass () {
		return Entity;	// use this class for the data model
	}

	get modelDescription () {
		return 'A single entity, identified by its GUID';
	}

	// compile all the routes to expose
	getRoutes () {
		let standardRoutes = super.getRoutes(ENTITIES_STANDARD_ROUTES);
		return [...standardRoutes, ...ENTITIES_ADDITIONAL_ROUTES];
	}

	describeErrors () {
		return {
			'Entities': Errors
		};
	}
}

module.exports = Entities;
