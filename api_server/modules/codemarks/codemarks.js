// provide a module to handle requests associated with "codemarks"

'use strict';

const Restful = require(process.env.CS_API_TOP + '/lib/util/restful/restful');
const CodemarkCreator = require('./codemark_creator');
const CodemarkUpdater = require('./codemark_updater');
const CodemarkDeleter = require('./codemark_deleter');

const Codemark = require('./codemark');

// expose these restful routes
const CODEMARK_STANDARD_ROUTES = {
	want: ['get', 'getMany', 'post', 'put', 'delete'],
	baseRouteName: 'codemarks',
	requestClasses: {
		'get': require('./get_codemark_request'),
		'getMany': require('./get_codemarks_request'),
		'post': require('./post_codemark_request'),
		'put': require('./put_codemark_request'),
		'delete': require('./delete_codemark_request')
	}
};

class Codemarks extends Restful {

	get collectionName () {
		return 'codemarks';	// name of the data collection
	}

	get modelName () {
		return 'codemark';	// name of the data model
	}

	get creatorClass () {
		return CodemarkCreator;	// use this class to instantiate codemarks
	}

	get modelClass () {
		return Codemark;	// use this class for the data model
	}

	get modelDescription () {
		return 'A single codemark, such as a question, issue, code trap, etc.';
	}

	get updaterClass () {
		return CodemarkUpdater;
	}

	get deleterClass () {
		return CodemarkDeleter;
	}
	
	getRoutes () {
		return  super.getRoutes(CODEMARK_STANDARD_ROUTES);
	}
}

module.exports = Codemarks;
