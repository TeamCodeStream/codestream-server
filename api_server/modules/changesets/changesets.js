// provide a module to handle requests associated with changesets

'use strict';

const Restful = require(process.env.CS_API_TOP + '/lib/util/restful/restful');
const ChangesetCreator = require('./changeset_creator');
//const ChangesetUpdater = require('./changeset_updater');
const Changeset = require('./changeset');

// expose these restful routes
const CHANGESET_STANDARD_ROUTES = {
	want: ['get', 'getMany'/*, 'put'*/],
	baseRouteName: 'changesets',
	requestClasses: {
		'get': require('./get_changeset_request'),
		'getMany': require('./get_changesets_request')
		//'put': require('./put_marker_request')
	}
};

// additional routes for this module
const CHANGESET_ADDITIONAL_ROUTES = [
];

class Changesets extends Restful {

	get collectionName () {
		return 'changesets';	// name of the data collection
	}

	get modelName () {
		return 'changeset';	// name of the data model
	}

	get creatorClass () {
		return ChangesetCreator;	// use this class to instantiate markers
	}

	get modelClass () {
		return Changeset;	// use this class for the data model
	}

	get modelDescription () {
		return 'A single changeset, part of a code review';
	}

	/*
	get updaterClass () {
		return ChangesetUpdater;
	}
	*/

	// get all routes exposed by this module
	getRoutes () {
		let standardRoutes = super.getRoutes(CHANGESET_STANDARD_ROUTES);
		return [...standardRoutes, ...CHANGESET_ADDITIONAL_ROUTES];
	}
}

module.exports = Changesets;
