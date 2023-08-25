// provides the Repo model for handling posts

'use strict';

const CodeStreamModel = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/models/codestream_model');
const CodeStreamModelValidator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/models/codestream_model_validator');
const NormalizeURL = require('./normalize_url');
const RepoAttributes = require('./repo_attributes');
const ArrayUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/array_utilities');

class Repo extends CodeStreamModel {

	getValidator () {
		return new CodeStreamModelValidator(RepoAttributes);
	}

	// right before the repo is saved...
	async preSave (options) {
		// enforce normalization of the URL
		if (this.attributes.url) {
			try{
				this.attributes.normalizedUrl = NormalizeURL(this.attributes.url);
			}
			catch(err){
				this.request.warn(`Unable to normalize remote url: ${remote}`, err);				
			}
		}
		// enforce lowercase on all IDs and the first commit hash
		this.lowerCase('firstCommitHash');
		this.lowerCase('knownCommitHashes');
		this.lowerCase('companyId');
		this.lowerCase('teamId');
		await super.preSave(options);
	}

	// check if the passed commit hash is a known commit hash for this repo
	haveKnownCommitHashes (commitHashes) {
		let knownCommitHashes = [...(this.get('knownCommitHashes') || [])];
		if (this.get('firstCommitHash')) {
			knownCommitHashes.push(this.get('firstCommitHash'));
		}
		return ArrayUtilities.intersection(knownCommitHashes, commitHashes).filter(hash => !!hash).length > 0;
	}

	// check if this repo matches any of the passed remote urls,
	// according to one of the remote urls known to identify this repo
	matchesRemotes (remotes) {
		// match on either the old single url, or on the new-style multiple remotes
		const myRemotes = this.getRemotes();
		// we match if any of our remotes match any of the passed remotes
		const i = ArrayUtilities.intersection(myRemotes, remotes).length > 0;
		return i;
	}

	getRemotes () {
		const remotes = (this.get('remotes') || []).map(remote => remote.normalizedUrl);
		if (this.get('normalizedUrl') && !remotes.includes(this.get('normalizedUrl'))) {
			remotes.push(this.get('normalizedUrl'));
		}
		return remotes;
	}
}

module.exports = Repo;
