// handle the "POST /no-auth/gitlens-user" request to register a new GitLens user,
// so we can match up with signups later

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request.js');

class GitLensUserRequest extends RestfulRequest {

	async authorize () {
		// no authorization necessary
	}

	// process the request...
	async process () {
		await this.requireAndAllow();		// require certain parameters, discard unknown parameters
		await this.addGitLensUser();		// add the GitLens user to our database
	}

	// require certain parameters, discard unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['emailHash']
				},
				optional: {
					string: ['machineIdHash']
				}
			}
		);

		if (this.request.body.emailHash.length > 200) {
			throw this.errorHandler.error('invalidParameter', { reason: 'emailHash must be less than 200 characters'});
		}
		if (this.request.body.machineIdHash && this.request.body.machineIdHash.length > 200) {
			throw this.errorHandler.error('invalidParameter', { reason: 'machineIdHash must be less than 200 characters'})
		} 
	}

	// add the GitLens user to our database
	async addGitLensUser () {
		const document = {
			emailHash: this.request.body.emailHash
		};
		if (this.request.body.machineIdHash) {
			document.machineIdHash = this.request.body.machineIdHash;
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
