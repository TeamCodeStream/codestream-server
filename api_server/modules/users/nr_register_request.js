// handle the "POST /no-auth/nr-register" request to register a new user via
// New Relic API key

'use strict';

const UserCreator = require('./user_creator');
const ConfirmHelper = require('./confirm_helper');
const Indexes = require('./indexes');
const Errors = require('./errors');
const AuthErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/authenticator/errors');
const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request.js');
const GraphQLClient = require('graphql-client');

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
				},
				optional: {
					string: ['apiRegion']
				}
			}
		);
	}

	// fetches the email and full name for the user from New Relic
	async getNewRelicUser () {
		try {
			let response;
			let baseUrl;
			switch (this.request.body.apiRegion) {
			case 'eu':
				baseUrl = 'https://api.eu.newrelic.com';
				break;
			case 'staging':
				baseUrl = 'https://staging-api.newrelic.com';
				break;
			case 'us':
			default:
				baseUrl = 'https://api.newrelic.com';
				break;
			}
			// check if we should use fake data from headers
			response = await this.checkHeaderSecrets();
			if (!response) {
				// TODO: consider a better way to do this
				const client = GraphQLClient({
					url: baseUrl + '/graphql',
					headers: {
						'Api-Key': this.request.body.apiKey,
						'Content-Type': 'application/json',
						'NewRelic-Requesting-Services': 'CodeStream'
					}
				});

				response = await client.query(`{
					actor {
						user {
							email
							id
							name
						}
					}
				}`);
			}
			if (response.errors) {
				throw response.errors.map(error => error.message).join(', ');
			}
			if (!response.data || !response.data.actor || !response.data.actor.user || !response.data.actor.user.email) {
				throw 'Did not retrieve email address from New Relic';
			}
			const email = response.data.actor.user.email;
			const userId = response.data.actor.user.id;
			const username = email.split('@')[0].replace(/\+/g, '');
			const fullName = (
				response.data &&
				response.data.actor &&
				response.data.actor.user &&
				response.data.actor.user.name
			);
			this.userData = {
				email,
				fullName,
				username,
				providerInfo: {
					newrelic: {
						accessToken: this.request.body.apiKey,
						data: {
							userId: userId,
							apiUrl: baseUrl
						},
						isApiToken: true
					}
				}
			};
		} catch (error) {
			throw this.errorHandler.error('failedToFetchNRData', { reason: error });
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
				data: {
					actor: {
						user: {
							email: headers['x-cs-mock-email'],
							id: headers['x-cs-mock-id'],
							name: headers['x-cs-mock-name']
						}
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
			throw this.errorHandler.error('alreadyRegistered');
		}
	}

	// create the user in the database
	async saveUser () {
		this.userCreator = new UserCreator({
			request: this,
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
					'apiRegion': '<New Relic region to query against>',
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
