// provide a module to handle requests associated with "codemarks"

'use strict';

const Restful = require(process.env.CS_API_TOP + '/lib/util/restful/restful');
const CodeMarkCreator = require('./codemark_creator');
const CodeMarkUpdater = require('./codemark_updater');
const CodeMark = require('./codemark');

// expose these restful routes
const CODEMARK_STANDARD_ROUTES = {
	want: ['get', 'getMany', 'post', 'put'],
	baseRouteName: 'codemarks',
	requestClasses: {
		'get': require('./get_codemark_request'),
		'getMany': require('./get_codemarks_request'),
		'post': require('./post_codemark_request'),
		'put': require('./put_codemark_request')
	}
};

class CodeMarks extends Restful {

	get collectionName () {
		return 'codemarks';	// name of the data collection
	}

	get modelName () {
		return 'codemark';	// name of the data model
	}

	get creatorClass () {
		return CodeMarkCreator;	// use this class to instantiate codemarks
	}

	get modelClass () {
		return CodeMark;	// use this class for the data model
	}

	get modelDescription () {
		return 'A single codemark, such as a question, issue, code trap, etc.';
	}

	get updaterClass () {
		return CodeMarkUpdater;
	}

	getRoutes () {
		return  super.getRoutes(CODEMARK_STANDARD_ROUTES);
	}
}

module.exports = CodeMarks;
