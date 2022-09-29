// provides a set of common routines for generating login codes

'use strict';

const ConfirmCode = require('./confirm_code');
const Indexes = require('./indexes');

class LoginCodeHelper {

	constructor (options) {
		Object.assign(this, options);
	}

	// generate and store a login code for a given user email
	async updateUserCode () {
		if (!this.email) {
			throw this.request.errorHandler.error('parameterRequired', { info: 'email' });
		}
		await this.getUser();
		await this.generateLoginCode();
		await this.updateUser();
		return {
			loginCode: this.loginCode,
			loginCodeAttempts: this.loginCodeAttempts,
			loginCodeExpiresAt: this.loginCodeExpiresAt
		};
	}

	// fetch the user object for the requested email address
	async getUser () {
		const oneUserPerOrg = (
			this.request.api.modules.modulesByName.users.oneUserPerOrg ||
			this.request.request.headers['x-cs-one-user-per-org']
		);
		const users = await this.request.data.users.getByQuery(
			{ searchableEmail: this.email.toLowerCase() },
			{ hint: Indexes.bySearchableEmail }
		);
		if (!oneUserPerOrg) { // remove when we have fully moved to ONE_USER_PER_ORG
			if (users.length > 1) {
				this.request.warn(`Found more than one user matching ${this.email}, but one-user-per-org is not active, this is bad`);
			}
			this.user = users[0];
		} else {
			// under ONE_USER_PER_ORG, find the first registered user, either on the team given, or if no team given,
			// that has no team
			this.user = users.find(user => {
				const teamIds = user.get('teamIds') || [];
				return (
					user.get('isRegistered') && 
					!user.get('deactivated') &&
					(
						(
							!this.teamId &&
							teamIds.length === 0
						) ||
						(
							this.teamId &&
							teamIds.length === 1 &&
							teamIds[0] === this.teamId
						)
					)
				);
			});
		}

		if (!this.user || !this.user.get('isRegistered') || this.user.get('deactivated')) {
			this.request.log(`User ${this.email} does not exist or is not registered, not generating login code`);
			delete this.user;
		} 
	}

	// generate a login code and expiry date
	async generateLoginCode () {
		if (!this.user) {
			return;
		}

		this.loginCode = ConfirmCode();
		// FIXME: this should be configurable
		const expiresIn = 15*60*1000;
		if (this.expiresIn && this.expiresIn < expiresIn) {
			this.loginCodeExpiresAt = Date.now() + this.expiresIn;
		}
		else {
			this.loginCodeExpiresAt = Date.now() + expiresIn;
		}
		this.loginCodeAttempts = 0;
	}

	// write the model to the user database
	async updateUser () {
		if (!this.user) {
			return;
		}

		const op = {
			$set: {
				loginCode: this.loginCode,
				loginCodeExpiresAt: this.loginCodeExpiresAt,
				loginCodeAttempts: this.loginCodeAttempts,
			},
		};
		this.request.data.users.applyOpById(this.user.id, op);
	}

	// send the email with the login code
	async sendEmail () {
		if (!this.user) {
			return;
		}
		if (this._delayEmail) {
			setTimeout(this.sendEmail.bind(this), this._delayEmail);
			delete this._delayEmail;
			return;
		}

		this.request.log(`Triggering email with login code to ${this.user.get('email')}...`);
		await this.request.api.services.email.queueEmailSend(
			{
				type: 'loginCode',
				userId: this.user.id,
			},
			{
				request: this.request,
				user: this.user,
			}
		);
	}

}

module.exports = LoginCodeHelper;
