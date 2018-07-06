// attributes for repo documents/models

'use strict';

module.exports = {
	companyId: {
		type: 'id',
		description: 'ID of the @@#company#company@@ with which the repo is associated'
	},
	teamId: {
		type: 'id',
		required: true,
		description: 'ID of the @@#team#team@@ with which the repo is associated'
	},
	url: {
		type: 'string',
		maxLength: 1024,
		description: 'URL of the repo, unnormalized, as it was received when this repo first became known'
	},
	normalizedUrl: {
		type: 'string',
		maxLength: 1024,
		description: 'URL of the repo, normalized to a state where URL\'s referring to the same repo should yield identical URLs'
	},
	companyIdentifier: {
		type: 'string',
		maxLength: 256,
		description: 'A server-generated string indicating a probable unique identifier for the company or org that owns the repo, based on domain and service (like github or bitbucket)'
	},
	firstCommitHash: {
		type: 'string',
		minLength: 40,
		maxLength: 40,
		description: 'The first commit hash in the commit history for this repo, as detected by git when the repo first became known (soon to be deprecated)'
	},
	knownCommitHashes: {
		type: 'arrayOfStrings',
		maxLength: 100,
		description: 'Any additional known commit hashes to be tracked for this repo (soon to be deprecated)'
	},
	remotes: {
		type: 'arrayOfObjects',
		maxLength: 100,
		maxObjectLength: 500,
		description: 'Array of objects representing the remote URLs for this repo; each object has: "url", "normalizedUrl", and "companyIdentifier", corresponding to the top-level attributes for when repos had only a single remote'
	},
	name: {
		type: 'string',
		maxLength: 100,
		description: 'Name of this repo, comes from the last part of the first URL by default (e.g. ”atom” in “git@github.com:TeamCodeStream/atom.git”)'
	}
};
