// this class should be used to create all repo documents in the database

'use strict';

const ModelCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_creator');
const Repo = require('./repo');
const NormalizeURL = require('./normalize_url');
const ExtractCompanyIdentifier = require('./extract_company_identifier');
const Errors = require('./errors');
const Path = require('path');

class RepoCreator extends ModelCreator {

	constructor (options) {
		super(options);
		this.errorHandler.add(Errors);
	}

	get modelClass () {
		return Repo;	// class to use to create a post model
	}

	get collectionName () {
		return 'repos';	// data collection to use
	}

	// convenience wrapper
	async createRepo (attributes) {
		return await this.createModel(attributes);
	}

	// get attributes that are required for repo creation, and those that are optional,
	// along with their types
	getRequiredAndOptionalAttributes () {
		return {
			required: {
				string: ['teamId']
			},
			optional: {
				'string': ['name'],
				'array(string)': ['remotes', 'knownCommitHashes']
			}
		};
	}

	// validate attributes for the repo we are creating
	async validateAttributes () {
		if (!this.attributes.remotes || this.attributes.remotes.length === 0) {
			throw this.errorHandler.error('oneRemoteRequired');
		}
		// enforce URL normalization and company identifier on all passed remotes
		let normalizedRemotes = [];
		await Promise.all(this.attributes.remotes.map(async remote => {
			const normalizedUrl = NormalizeURL(remote);
			normalizedRemotes.push({
				url: remote,
				normalizedUrl,
				companyIdentifier: ExtractCompanyIdentifier.getCompanyIdentifier(normalizedUrl)
			});
		}));
		this.attributes.remotes = normalizedRemotes;
	}

	// right before we save the model...
	async preSave () {
		this.attributes.creatorId = this.user.id;	// establish creator of the repo as originator of the request
		if (this.request.isForTesting()) { // special for-testing header for easy wiping of test data
			this.attributes._forTesting = true;
		}
		this.createId();			// requisition an ID for the repo
		this.extractName();
		await super.preSave();		// proceed with the save...
	}
    
	// extract the name from the first remote URL passed in, unless it is provided
	async extractName () {
		if (this.attributes.name) {
			// name provided
			return;
		}
		const parsedPath = Path.parse(this.attributes.remotes[0].normalizedUrl);
		this.attributes.name = parsedPath.name + (parsedPath.ext || '');
	}
}

module.exports = RepoCreator;
