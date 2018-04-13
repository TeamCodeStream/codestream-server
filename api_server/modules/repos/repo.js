// provides the Repo model for handling posts

'use strict';

const CodeStreamModel = require(process.env.CS_API_TOP + '/lib/models/codestream_model');
const CodeStreamModelValidator = require(process.env.CS_API_TOP + '/lib/models/codestream_model_validator');
const NormalizeURL = require('./normalize_url');
const RepoAttributes = require('./repo_attributes');
const ArrayUtilities = require(process.env.CS_API_TOP + '/server_utils/array_utilities');

class Repo extends CodeStreamModel {

	getValidator () {
		return new CodeStreamModelValidator(RepoAttributes);
	}

	// right before the repo is saved...
	async preSave (options) {
		// enforce normalization of the URL
		this.attributes.normalizedUrl = NormalizeURL(this.attributes.url);
		// enforce lowercase on all IDs and the first commit hash
		this.lowerCase('firstCommitHash');
		this.lowerCase('knownCommitHashes');
		this.lowerCase('companyId');
		this.lowerCase('teamId');
		await super.preSave(options);
	}

	// check if the passed commit hash is a known commit hash for this repo
	haveKnownCommitHash (commitHashes) {
		let knownCommitHashes = [...(this.get('knownCommitHashes') || [])];
		knownCommitHashes.push(this.get('firstCommitHash'));
		return ArrayUtilities.intersection(knownCommitHashes, commitHashes).length > 0;
	}
}

module.exports = Repo;
