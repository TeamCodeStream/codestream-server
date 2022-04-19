// handle the "POST /no-auth/nr-register" request to register a new user via
// New Relic API key

'use strict';

const UserCreator = require('./user_creator');
const ConfirmHelper = require('./confirm_helper');
const Indexes = require('./indexes');
const Errors = require('./errors');
const AuthErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/authenticator/errors');
const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request.js');
const { request, gql } = require('graphql-request');

class NRRegisterRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(Errors);
		this.errorHandler.add(AuthErrors);
	}

	// authorization happens via New Relic in the process phase
	async authorize () {
	}

	async process () {
		await this.requireAndAllow();	// set request parameters
		await this.getNewRelicUser();	// fetches the email and full name for the user from New Relic
		await this.getExistingUser();	// check if a user already exists for the email address
		await this.saveUser();			// create the user in the database
		await this.doLogin();			// log the user in
	}

	// require certain parameters, discard unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['apiKey']
				}
			}
		);
	}

	// fetches the email and full name for the user from New Relic
	async getNewRelicUser () {
		try {
			let response;
			const baseUrl = this.api.config.sharedGeneral.newRelicApiUrl || 'https://api.newrelic.com';

			// check if we should use fake data from headers
			response = await this.checkHeaderSecrets();
			if (!response) {
				const url = baseUrl + '/graphql';
				const query = gql`{
					actor {
						user {
							email
							id
							name
						}
					}
				}`;
				const headers = {
					'Api-Key': this.request.body.apiKey,
					'Content-Type': 'application/json',
					'NewRelic-Requesting-Services': 'CodeStream'
				}
				response = await request(url, query, {}, headers);
			}
			if (!response.actor || !response.actor.user || !response.actor.user.email) {
				this.warn('Response from NR: ' + JSON.stringify(response, undefined, 5));
				throw 'Did not retrieve email address from New Relic';
			}
			const email = response.actor.user.email;
			this.nrUserId = response.actor.user.id;
			const username = email.split('@')[0].replace(/\+/g, '');
			const fullName = (
				response.actor &&
				response.actor.user &&
				response.actor.user.name
			);
			this.userData = {
				email,
				fullName,
				username,
				providerInfo: {
					newrelic: {
						accessToken: this.request.body.apiKey,
						data: {
							userId: this.nrUserId
						},
						isApiToken: true
					}
				}
			};
		} catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			this.warn('Caught error running GraphQL query: ' + message);
			throw this.errorHandler.error('failedToFetchNRData', { reason: message });
		}
	}

	// check whether we should fake fetching data from NR
	async checkHeaderSecrets () {
		// TODO: use a more appropriate secret for this
		const secretsList = (this.api.config.sharedSecrets.commentEngineSecrets || []);
		// TODO: handle case where secretsList is empty
		const { headers } = this.request;
		if (secretsList.includes(headers['x-cs-newrelic-secret']) && headers['x-cs-mock-email']) {
			this.warn('Secret provided to use mock NR user data, this had better be a test!');
			return {
				actor: {
					user: {
						email: headers['x-cs-mock-email'],
						id: parseInt(headers['x-cs-mock-id'], 10),
						name: headers['x-cs-mock-name']
					}
				}
			};
		}
	}

	// check if a user already exists for the email address
	async getExistingUser () {
		this.user = await this.data.users.getOneByQuery(
			{ searchableEmail: this.userData.email.toLowerCase() },
			{ hint: Indexes.bySearchableEmail }
		);
		if (this.user) {
			throw this.errorHandler.error('alreadyRegistered', { info: this.userData.email });
		}
	}

	// create the user in the database
	async saveUser () {
		this.userCreator = new UserCreator({
			request: this,
			nrUserId: this.nrUserId
		});
		this.user = await this.userCreator.createUser(this.userData);
	}

	// mark the user as registered and log them in
	async doLogin () {
		this.responseData = await new ConfirmHelper({
			request: this,
			user: this.user
		}).confirm(this.userData);
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'nr-register',
			summary: 'Registers a user via New Relic',
			access: 'No authorization needed',
			description: 'Registers a user for the email address retrieved via a New Relic API key; this will create a new user record if a user with that email doesn\'t already exist, or it will return the user record for a user if a user with that email does exist and is not yet confirmed.',
			input: {
				summary: 'Specify attributes in the body',
				looksLike: {
					'apiKey*': '<New Relic API key used to retrieve user information>',
				}
			},
			returns: {
				summary: 'Returns a user object',
				looksLike: {
					user: '<@@#user object#user@@>'
				}
			},
			errors: [
				'parameterRequired',
				'exists',
				'validation',
				'failedToFetchNRData',
				'tokenExpired',
				'alreadyRegistered',
				'notFound',
				'createAuth'
			]
		};
	}
}

module.exports = NRRegisterRequest;
