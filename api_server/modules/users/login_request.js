// handle the "PUT /no-auth/login" request to log a user in, verifying password
// and giving them an access token to use for future requests

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');
const BCrypt = require('bcrypt');
const InitialDataFetcher = require('./initial_data_fetcher');
const UserSubscriptionGranter = require('./user_subscription_granter');
const Indexes = require('./indexes');
const Errors = require('./errors');
const { callbackWrap } = require(process.env.CS_API_TOP + '/server_utils/await_utils');

class LoginRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(Errors);
	}

	async authorize () {
		// no pre-authorization needed, authorization is done according to email and password
	}

	// process the request....
	async process () {
		await this.requireAndAllow();			// require certain parameters, and discard unknown parameters
		await this.getUser();					// get the user indicated by email in the request
		await this.validatePassword();			// validate the given password matches their password hash
		await this.getInitialData();			// fetch the initial data to return in the response
		await this.grantSubscriptionPermissions();	// grant the user permission to subscribe to various messager channels
		await this.formResponse();				// form the response to the request
	}

	// require these parameters, and discard any unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['email', 'password']
				}
			}
		);
	}

	// get the user indicated by the passed email
	async getUser () {
		this.user = await this.data.users.getOneByQuery(
			{
				searchableEmail: this.request.body.email.toLowerCase()
			},
			{
				databaseOptions: {
					hint: Indexes.bySearchableEmail
				}
			}
		);
		if (!this.user || this.user.get('deactivated')) {
			throw this.errorHandler.error('notFound', { info: 'email' });
		}
	}

	// validate that the given password matches the password hash stored for the user
	async validatePassword () {
		let result;
		try {
			result = await callbackWrap(
				BCrypt.compare,
				this.request.body.password,
				this.user.get('passwordHash')
			);
		}
		catch (error) {
			throw this.errorHandler.error('token', { reason: error });
		}
		if (!result) {
			throw this.errorHandler.error('passwordMismatch');
		}
		if (!this.user.get('isRegistered')) {
			throw this.errorHandler.error('noLoginUnregistered');
		}
	}

	// get the initial data to return in the response, this is a time-saver for the client
	// so it doesn't have to fetch this data with separate requests
	async getInitialData () {
		this.initialData = await new InitialDataFetcher({
			request: this
		}).fetchInitialData();
	}

	// grant the user permission to subscribe to various messager channels
	async grantSubscriptionPermissions () {
		// note - it is tough to determine whether this should go before or after the response ... with users in a lot
		// of streams, there could be a performance hit here, but do we want to take a performance hit or do we want
		// to risk the client subscribing to channels for which they don't yet have permissions? i've opted for the
		// performance hit, and i suspect it won't ever be a problem, but be aware...
		try {
			await new UserSubscriptionGranter({
				data: this.data,
				messager: this.api.services.messager,
				user: this.user,
				request: this
			}).grantAll();
		}
		catch (error) {
			throw this.errorHandler.error('userMessagingGrant', { reason: error });
		}
	}

	// form the response to the request
	async formResponse () {
		this.responseData = {
			user: this.user.getSanitizedObjectForMe(),	// include me-only attributes
			accessToken: this.user.get('accessToken'),	// access token to supply in future requests
			pubnubKey: this.api.config.pubnub.subscribeKey	// give them the subscribe key for pubnub
		};
		Object.assign(this.responseData, this.initialData);
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'login',
			summary: 'Performs login',
			access: 'No authorization needed, though email and password check are obviously performed',
			description: 'Performs a login for a given user and returns an access token for use with future requests',
			input: {
				summary: 'Specify attributes in the body',
				looksLike: {
					'email*': '<User\'s email>',
					'password*': '<Password to verify>'
				}
			},
			returns: {
				summary: 'Returns an updated user object, plus access token and PubNub subscription key, and teams the user is on as well as repos owned by those teams',
				looksLike: {
					user: '<@@#user object#user@@>',
					accessToken: '<user\'s access token, to be used in future requests>',
					pubnubKey: '<key to use for subscribing to PubNub channels>',
					teams: [
						'<@@#team object#team@@>',
						'...'
					],
					repos: [
						'<@@#repo object#repo@@>',
						'...'
					]
				}
			},
			errors: [
				'parameterRequired',
				'notFound',
				'passwordMismatch',
				'noLoginUnregistered'
			]
		};
	}
}

module.exports = LoginRequest;
