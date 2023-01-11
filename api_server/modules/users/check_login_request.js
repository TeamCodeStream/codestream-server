// handle the "PUT /no-auth/check-login" request to check email/password credentials for a user
// (like a login but without returning all the data)

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request.js');
const Errors = require('./errors');
const LoginCore = require('./login_core');

class LoginCheckRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(Errors);
	}

	async authorize () {
		// no pre-authorization needed, authorization is done according to email and password
	}

	// process the request....
	async process () {
		await this.requireAndAllow();	// require certain parameters, and discard unknown parameters
		await this.checkLogin();		// check the login credentials
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

	// attempt to find the team associated with the New Relic org passed

	// handle the actual login check ... get user and validate password
	async checkLogin () {
		const { email, password } = this.request.body;
		this.user = await new LoginCore({
			request: this
		}).login(email, password);
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'check-login',
			summary: 'Performs a check of login credentials',
			access: 'No authorization needed, though email and password check are obviously performed',
			description: 'Performs a check of login credentials for a given user against all users with the given email',
			input: {
				summary: 'Specify attributes in the body',
				looksLike: {
					'email*': '<User\'s email>',
					'password*': '<Password to verify>'
				}
			},
			returns: {
				summary: 'Returns an empty object on success',
			},
			errors: [
				'parameterRequired',
				'passwordMismatch'
			]
		};
	}
}

module.exports = LoginCheckRequest;
