// handle the "PUT /change-password" request to change the user's password

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
const ChangePasswordCore = require(process.env.CS_API_TOP + '/modules/users/change_password_core');
const Errors = require('./errors');
const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');

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

		// only allow setting password and not providing existing password if the user's
		// mustSetPassword flag is set, forcing the user to set their password, 
		// which could mean the user is coming from being a Slack or MSTeams user
		if (!this.user.get('mustSetPassword') && !this.request.body.existingPassword) {
			throw this.errorHandler.error('parameterRequired', { info: 'existingPassword' });
		}

		const changePasswordCore = new ChangePasswordCore({
			request: this			
		});
		if (this.request.body.existingPassword) {
			await changePasswordCore.changePassword(this.user, this.request.body.newPassword, this.request.body.existingPassword);
		} 
		else {
			await changePasswordCore.setPassword(this.user, this.request.body.newPassword);
		}

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
					string: ['newPassword']
				},
				optional: {
					string: ['existingPassword']
				}
			}
		);
	}

	// after the response is sent...
	async postProcess () {
		
		// for users with a mustSetPassword, clear the mustSetPassword flag 
		// along with providerInfo as needed ... this needs to all happen
		// in postProcess to avoid the user update getting conflated with the
		// user update that actually updates the password
		if (!this.user.get('mustSetPassword')) {
			return;

		}
		await this.updateUser();

		// publish the update message
		const channel = 'user-' + this.user.id;
		const message = Object.assign({}, this.userUpdateOp, { requestId: this.request.id });
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this	}
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate
			this.warn(`Unable to publish clear providerInfo message to channel ${channel}: ${JSON.stringify(error)}`);
		}
	}

	// for users with a mustSetPassword, clear the mustSetPassword flag 
	// along with providerInfo as needed
	async updateUser () {
		// clear the mustSetPassword flag
		const op = {
			$unset: {
				mustSetPassword: true
			}
		};

		// clear any provider info associated with slack or msteams,
		// the sharing model will require authenticating against a new app
		if (this.user.get('clearProviderInfo')) {
			this.clearProviderInfo(op);
		}

		this.userUpdateOp = await new ModelSaver({
			request: this.request,
			collection: this.data.users,
			id: this.user.id
		}).save(op);
	}

	// clear provider info associated with slack and msteams for user who has mustSetPassword flag set
	async clearProviderInfo (op) {
		const providerInfo = this.user.get('providerInfo') || {};
		Object.keys(providerInfo).forEach(teamId => {
			if (teamId === 'slack' || teamId === 'msteams') {
				op.$unset[`providerInfo.${teamId}`] = true;
			}
			else if (providerInfo[teamId].slack) {
				op.$unset[`providerInfo.${teamId}.slack`] = true;
			}
			else if (providerInfo[teamId].msteams) {
				op.$unset[`providerInfo.${teamId}.msteams`] = true;
			}
		});
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
