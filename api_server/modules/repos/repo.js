// provides the Repo model for handling posts

'use strict';

var CodeStreamModel = require(process.env.CS_API_TOP + '/lib/models/codestream_model');
var CodeStreamModelValidator = require(process.env.CS_API_TOP + '/lib/models/codestream_model_validator');
var NormalizeURL = require('./normalize_url');
const RepoAttributes = require('./repo_attributes');

class Repo extends CodeStreamModel {

	getValidator () {
		return new CodeStreamModelValidator(RepoAttributes);
	}

	// right before the repo is saved...
	preSave (callback, options) {
		// enforce normalization of the URL
		this.attributes.normalizedUrl = NormalizeURL(this.attributes.url);
		// enforce lowercase on all IDs and the first commit hash
		this.lowerCase('firstCommitHash');
		this.lowerCase('companyId');
		this.lowerCase('teamId');
		super.preSave(callback, options);
	}

	// check if the passed commit hash is a known commit hash for this repo
	isKnownCommitHash (commitHash) {
		let knownCommitHashes = [...(this.get('knownCommitHashes') || [])];
		knownCommitHashes.push(this.get('firstCommitHash'));
		return knownCommitHashes.includes(commitHash);
	}
}

module.exports = Repo;
