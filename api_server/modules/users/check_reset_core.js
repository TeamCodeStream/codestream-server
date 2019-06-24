'use strict';

const Indexes = require('./indexes');

class CheckResetCore {
	constructor (options) {
		Object.assign(this, options);
	}

	// parse and verify the passed token
	async getUserFromToken(token) {
		try {
			this.payload = this.request.api.services.tokenHandler.verify(token);
		}
		catch (error) {
			const message = typeof error === 'object' ? error.message : error;
			if (message === 'jwt expired') {				
				throw this.errorHandler.error('tokenExpired');
			}
			else {				
				throw this.errorHandler.error('tokenInvalid', { reason: message });
			}
		}
		if (this.payload.type !== 'rst') {			
			throw this.errorHandler.error('tokenInvalid', { reason: 'not an rst token' });
		}
		await this.getUser();
		await this.validateToken();

		return this.user;
	}

	// get the user associated with the email in the token payload
	async getUser () {
		if (!this.payload.email) {
			throw this.errorHandler.error('tokenInvalid', { reason: 'no email found in rst token' });
		}
		const users = await this.request.data.users.getByQuery(
			{ 
				searchableEmail: this.payload.email.toLowerCase() 
			},
			{
				hint: Indexes.bySearchableEmail
			}
		);
		if (users.length < 1) {			
			throw this.errorHandler.error('tokenInvalid', { reason: 'user not found' });
		}
		this.user = users[0];
	}

	// verify the token is not expired, per the most recently issued token
	async validateToken () {		
		const accessTokens = this.user.get('accessTokens') || {};
		const resetTokens = accessTokens.rst || {};
		if (!resetTokens || !resetTokens.minIssuance) {			
			throw this.errorHandler.error('tokenInvalid', { reason: 'no issuance for rst token found' });
		}
		if (resetTokens.minIssuance > this.payload.iat * 1000) {
			throw this.errorHandler.error('tokenInvalid', { reason: 'a more recent rst token has been issued' });
		}
	}
} 

module.exports = CheckResetCore;
