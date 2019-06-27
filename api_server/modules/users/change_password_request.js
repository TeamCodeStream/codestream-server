// handle the "PUT /change-password" request to change the user's password

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
const ChangePasswordCore = require(process.env.CS_API_TOP + '/modules/users/change_password_core');
const Errors = require('./errors');

class ChangePasswordRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(Errors);
	}

	async authorize () {
		// only applies to current user, no authorization required
	}

	// process the request....
	async process () {
		await this.requireAndAllow();	// require certain parameters, and discard unknown parameters
		
		const changePasswordCore = new ChangePasswordCore({
			request: this			
		});
		await changePasswordCore.changePassword(this.user, this.request.body.newPassword, this.request.body.existingPassword);

		this.responseData = {
			accessToken: changePasswordCore.accessToken
		};
	}

	// require these parameters, and discard any unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['newPassword', 'existingPassword']
				}
			}
		);
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'password',
			summary: 'Change a user\'s password',
			access: 'Current user can only change their own password',
			description: 'Change a user\'s password, providing the current password for security. Note that this invalidates all current access tokens for the user; a new access token will be returned with the response to the request, but other sessions will no longer be able to authenticate.',
			input: {
				summary: 'Specify existing password and new password in the request body',
				looksLike: {
					'existingPassword*': '<User\'s existing password>',
					'newPassword*': '<User\'s new password>'
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
				'passwordMismatch',
				'validation'
			]
		};
	}
}

module.exports = ChangePasswordRequest;
