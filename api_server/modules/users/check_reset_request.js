// handle the "PUT /check_reset" request to check the validity of a token issues for resetting password

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
const AuthenticatorErrors = require(process.env.CS_API_TOP + '/modules/authenticator/errors');
const CheckResetCore = require(process.env.CS_API_TOP+ '/modules/users/check_reset_core');
 
class CheckResetRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(AuthenticatorErrors);
	}

	async authorize () {
		// no authorization necessary, authorization handled during the request processing
	}

	// process the request....
	async process () {
		await this.requireAndAllow();	// require certain parameters, and discard unknown parameters	
		this.user = await new CheckResetCore({
			request: this			
		}).getUserFromToken(this.request.query.token);

		this.responseData = {
			email: this.user.get('email')
		};		
	}

	// require these parameters, and discard any unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters(
			'query',
			{
				required: {
					string: ['token']
				}
			}
		);		
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'check-reset',
			summary: 'Check that a token can still be used to reset a user\'s password',
			access: 'No access rules, though the token must be valid and not expired',
			description: 'Use this API to check that a token that was issued for password reset will still work. This would be called in advance of displaying a form where the user would type in a new password, sort of a pre-flight check that the password reset will work.',
			input: {
				summary: 'Specify the token as a query parameter',
				looksLike: {
					'token*': '<Reset password token>'
				}
			},
			returns: {
				summary: 'The email associated with the token',
				looksLike: {
					email: '<User\'s email>'
				}
			},
			errors: [
				'parameterRequired',
				'tokenInvalid',
				'tokenExpired'
			]
		};
	}
}

module.exports = CheckResetRequest;
