// handle the "POST /no-auth/gitlens-user" request to register a new GitLens user,
// so we can match up with signups later

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request.js');
const GitLensUserIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/gitlens_user_indexes');

class GitLensUserRequest extends RestfulRequest {

	async authorize () {
		// no authorization necessary
	}

	// process the request...
	async process () {
		await this.requireAndAllow();		// require certain parameters, discard unknown parameters
		await this.addGitLensUsers();		// add one or more GitLens users to our database
	}

	// require certain parameters, discard unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters(
			'body',
			{
				required: {
					'array(string)': ['emailHashes']
				},
				optional: {
					string: ['machineIdHash'],
					boolean: ['installed']
				}
			}
		);

		if (this.request.body.emailHashes.length > 50) {
			throw this.errorHandler.error('invalidParameter', { reason: 'cannot send more than 50 email hashes'})
		}
		if (this.request.body.emailHashes.find(hash => hash.length > 200)) {
			throw this.errorHandler.error('invalidParameter', { reason: 'email hash must be less than 200 characters'});
		}
		if (this.request.body.machineIdHash && this.request.body.machineIdHash.length > 200) {
			throw this.errorHandler.error('invalidParameter', { reason: 'machineIdHash must be less than 200 characters'})
		} 
	}

	// add one or more GitLens users to our database
	async addGitLensUsers () {
		return Promise.all(this.request.body.emailHashes.map(async emailHash => {
			await this.addGitLensUser(emailHash);
		}));
	}
	
	async addGitLensUser (emailHash) {
		const { machineIdHash, installed } = this.request.body;
		const document = { emailHash };
		if (machineIdHash) {
			document.machineIdHash = machineIdHash.toLowerCase();
		}

		// prevent duplicates
		const existing = await this.api.data.gitLensUsers.getOneByQuery(document, { hint: GitLensUserIndexes.byEmailHash });
		if (existing) {
			// but update the "installed" flag if provided
			if (installed && !existing.installed) {
				return this.api.data.gitLensUsers.updateDirect(
					{ _id: this.api.data.gitLensUsers.objectIdSafe(existing._id) },
					{ $set: { installed: true } }
				);
			} else {
				return;
			}
		}

		document.createdAt = Date.now();
		if (installed) {
			document.installed = true;
		}
		return this.api.data.gitLensUsers.create(document, { noVersion: true });
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'gitlens-user',
			summary: 'Creates a GitLens a user',
			access: 'No authorization needed',
			description: 'Creates a known GitLens user, according to a one-way hash of email and optional machine ID, for later lookup when a user signs up for CodeStream.',
			input: {
				summary: 'Specify attributes in the body',
				looksLike: {
					'emailHash*': '<SHA1 hash of user\'s email, in hex>',
					'machineIdHash': '<SHA1 hash of machine identifier, in hex>'
				}
			},
			returns: {
				summary: 'Empty object',
			},
			errors: [
				'parameterRequired',
				'invalidParameter'
			]
		};
	}
}

module.exports = GitLensUserRequest;
