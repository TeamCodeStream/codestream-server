// handle the "PUT /reset_password" request to reset a user's password

'use strict';

const CheckResetRequest = require('./check_reset_request');
const ChangePasswordRequest = require('./change_password_request');
const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');

class ResetPasswordRequest extends Aggregation(CheckResetRequest, ChangePasswordRequest) {

	// process the request....
	async process () {
		await CheckResetRequest.prototype.process.call(this);
		await ChangePasswordRequest.prototype.process.call(this);
	}

	// require these parameters, and discard any unknown parameters
	// this is an override of CheckResetRequest.requireAndAllow
	async requireAndAllow () {
		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['token', 'password']
				}
			}
		);
		this.token = this.request.body.token;
		this.password = this.request.body.password;
	}

	// override ChangePasswordRequest.validatePassword, this step is not necessary
	async validatePassword () {
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'reset-password',
			summary: 'Reset a user\'s password, using the token provided by the forgot-password request',
			access: 'No access rules, though the token must be valid and not expired',
			description: 'Once a token has been obtained by calling @@#forgot-password#forgot-password@@, use this API call to actually set the user\'s password. Note that this invalidates all current access tokens for the user; a new access token will be returned with the response to the request, but other sessions will no longer be able to authenticate.',
			input: {
				summary: 'Specify the token and the new password in the request body',
				looksLike: {
					't*': '<Reset password token>',
					'password*': '<New password>'
				}
			},
			returns: {
				summary: 'A new access token',
				looksLike: {
					accessToken: '<New access token>'
				}
			},
			errors: [
				'parameterRequired',
				'tokenInvalid',
				'tokenExpired',
				'validation'
			]
		};
	}
}

module.exports = ResetPasswordRequest;
