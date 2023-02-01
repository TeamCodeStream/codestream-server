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
		const users = await this.request.data.users.getByQuery(
			{ searchableEmail: this.email.toLowerCase() },
			{ hint: Indexes.bySearchableEmail }
		);
		// under one-user-per-org, find the first registered user, matching the team, if given
		this.user = users.find(user => {
			const teamIds = user.get('teamIds') || [];
			return (
				user.get('isRegistered') && 
				!user.get('deactivated') &&
				(
					(
						!this.teamId
					) ||
					(
						teamIds.length === 1 &&
						teamIds[0] === this.teamId
					)
				)
			);
		});

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
