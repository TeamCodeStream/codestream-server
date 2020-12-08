// provides the RepoByCommitHash model for associating commit hashes with repo IDs

'use strict';

const DataModel = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/data_collection/data_model');
const DataModelValidator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/data_collection/data_model_validator');
const RepoByCommitHashAttributes = require('./repo_by_commit_hash_attributes');

class RepoByCommitHash extends DataModel {

	getValidator() {
		return new DataModelValidator(RepoByCommitHashAttributes);
	}

	// right before the repo is saved...
	async preSave(options) {
		this.lowerCase('commitHash');
		this.lowerCase('repoId');
		await super.preSave(options);
	}
}

module.exports = RepoByCommitHash;
