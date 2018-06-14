'use strict';

class SignupTokens {

	constructor (options) {
		Object.assign(this, options);
		if (!this.api) {
			throw 'API object required for SignupTokens';
		}
		this.expirationTime = this.api.config.api.signupTokenExpiration;
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

	async insert (token, userId) {
		const expiresAt = Date.now() + this.expirationTime;
		const tokenData = {
			token,
			userId,
			expiresAt
		};
		await this.removeOldTokens();
		return await this._insert(tokenData);
	}

	async find (token) {
		await this.removeOldTokens();
		return await this._find(token);
	}

	async removeOldTokens () {
		const cutoff = Date.now() - this.expirationTime;
		await this.collection.deleteByQuery(
			{
				expiresAt: { $lt: cutoff }
			}
		);
	}

	async _insert (tokenData) {
		return await this.collection.create(tokenData);
	}

	async _find (token) {
		const tokens = await this.collection.getByQuery({ token });
		const tokenData = tokens[0];
		if (!tokenData || tokenData.expiresAt < Date.now()) {
			return;
		}
		return tokenData.userId;
	}

}

module.exports = SignupTokens;