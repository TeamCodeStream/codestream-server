// this class should be used to update code error documents in the database

'use strict';

const ModelUpdater = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_updater');
const CodeError = require('./code_error');

class CodeErrorUpdater extends ModelUpdater {

	get modelClass () {
		return CodeError;	// class to use to create a code error model
	}

	get collectionName () {
		return 'codeErrors';	// data collection to use
	}

	// convenience wrapper
	async updateCodeError (id, attributes) {
		return await this.updateModel(id, attributes);
	}

	// get attributes that are allowed, we will ignore all others
	getAllowedAttributes () {
		return {
			string: ['ticketUrl', 'ticketProviderId', 'title', 'text'],
			'array(object)': ['stackTraces']
		};
	}

	// called before the code error is actually saved
	async preSave () {
		// proceed with the save...
		this.attributes.modifiedAt = Date.now();
		await super.preSave();
	}
}

module.exports = CodeErrorUpdater;
