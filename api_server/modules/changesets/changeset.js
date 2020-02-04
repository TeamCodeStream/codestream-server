// provides the Changeset model for handling changesets

'use strict';

const CodeStreamModel = require(process.env.CS_API_TOP + '/lib/models/codestream_model');
const CodeStreamModelValidator = require(process.env.CS_API_TOP + '/lib/models/codestream_model_validator');
const ChangesetAttributes = require('./changeset_attributes');

class Changeset extends CodeStreamModel {

	getValidator () {
		return new CodeStreamModelValidator(ChangesetAttributes);
	}

	// called right before we save...
	async preSave (options) {
		// ensure all IDs are lowercase
		this.lowerCase('teamId');
		this.lowerCase('repoId');
		await super.preSave(options);
	}
}

module.exports = Changeset;
