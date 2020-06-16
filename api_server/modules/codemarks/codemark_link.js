// provides the CodemarkLink model for handling codemark links,
// which are really just a mapping between permalink IDs and codemark IDs
// note that we don't derive from the standard CodeStreamModel here,
// so we don't have usual attributes like creatorId, createdAt, etc.
// these aren't necessary and we save a little space and bandwidth

'use strict';

const DataModel = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/data_collection/data_model');
const DataModelValidator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/data_collection/data_model_validator');
const CodemarkLinkAttributes = require('./codemark_link_attributes');

class CodemarkLink extends DataModel {

	getValidator () {
		return new DataModelValidator(CodemarkLinkAttributes);
	}

	// called right before we save...
	async preSave (options) {
		// ensure all IDs are lowercase
		this.attributes.teamId = this.attributes.teamId.toLowerCase();
		await super.preSave(options);
	}
}

module.exports = CodemarkLink;
