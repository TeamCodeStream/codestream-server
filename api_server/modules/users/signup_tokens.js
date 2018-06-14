'use strict';

class SignupTokens {

	constructor (options) {
		Object.assign(this, options);
		if (!this.api) {
			throw 'API object required for SignupTokens';
		}
		this.expirationTime = parseInt(this.api.config.api.signupTokenExpiration, 10);
		if (!this.expirationTime) {
			throw 'no expiration time found for SignupTokens';
		}
	}

	initialize () {
		this.collection = this.api.data.signupTokens;
		if (!this.collection) {
			throw 'no collection found for SignupTokens';
		}
	}

	async insert (token, userId, options) {
		const expiresAt = Date.now() + this.expirationTime;
		const tokenData = {
			token,
			userId,
			expiresAt
		};
		await this.removeOldTokens(options);
		return await this._insert(tokenData, options);
	}

	async find (token, options) {
		await this.removeOldTokens(options);
		return await this._find(token, options);
	}

	async removeOldTokens (options) {
		const cutoff = Date.now() - this.expirationTime;
		await this.collection.deleteByQuery(
			{
				expiresAt: { $lt: cutoff }
			},
			options
		);
	}

	async _insert (tokenData, options) {
		return await this.collection.create(tokenData, options);
	}

	async _find (token, options) {
		const tokens = await this.collection.getByQuery({ token }, options);
		const tokenData = tokens[0];
		if (!tokenData || tokenData.expiresAt < Date.now()) {
			return;
		}
		return tokenData.userId;
	}

}

module.exports = SignupTokens;