// provides a helper class for managing the saving and retrieval of signup tokens
// signup tokens are used to identify an IDE sesssion with a user signup ...
// since the IDE signup takes the user to the web, the client IDE generates a
// signup token that is passed along with the link to the web signup, then 
// polls for the server to say that the signup token has been associated with
// a user signup

'use strict';

const Indexes = require('./signup_token_indexes');

class SignupTokens {

	constructor (options) {
		Object.assign(this, options);
		if (!this.api) {
			throw 'API object required for SignupTokens';
		}
		this.expirationTime = parseInt(this.api.config.apiServer.signupTokenExpiration, 10);
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

	// insert a single signup token, and associate it with the given user ID
	async insert (token, userId, options = {}) {
		const tokenData = {
			token,
			userId
		};
		let expiresIn = this.expirationTime;
		if (typeof options.expiresIn === 'number' && options.expiresIn < this.expirationTime) {
			expiresIn = options.expiresIn;
		}
		else if (typeof options.secureExpiresIn === 'number') {
			expiresIn = options.secureExpiresIn;
		}
		tokenData.expiresAt = Date.now() + expiresIn;
		if (typeof options.more === 'object') {
			Object.assign(tokenData, options.more);
		}
		if (options.isInviteCode) {
			tokenData.isInviteCode = true;
		}

		// we always remove old tokens, keeping the signupTokens collection small
		await this.removeOldTokens(options);

		return await this._insert(tokenData, options);
	}

	// find a record for a given signup token
	async find (token, options) {

		// workaround for VSCode bug, where paste can do a double paste
		if (token.length === 72 && token.substring(0, 36) === token.substring(36)) {
			token = token.substring(0, 36);
		}

		const tokenFound = await this._find(token, options);

		// we always remove old tokens, keeping the signupTokens collection small
		await this.removeOldTokens(options);

		return tokenFound;
	}

	// remove a signup token, presumably because it has been used and is no longer valid
	async remove (token, options) {
		options = Object.assign({}, options, /*{ hint: Indexes.byToken }*/ { overrideHintRequired: true });
		await this.collection.deleteByQuery(
			{ token },
			options
		);
	}

	// remove all tokens older than the configured expiration time, since these
	// are now invalid anyway, and we should keep the signupTokens collection small
	async removeOldTokens (options) {
		const cutoff = Date.now() - this.expirationTime;
		options = Object.assign({}, options, /*{ hint: Indexes.byExpiresAt }*/ { overrideHintRequired: true });
		await this.collection.deleteByQuery(
			{
				expiresAt: { $lt: cutoff }
			},
			options
		);
	}

	// remove tokens associated with a particular user
	async removeInviteCodesByUserId (userId) {
		// NOTE - there is a concession here ... there is no index for userId on the signupTokens collection
		// we're assuming that the total number of records in this collection is kept small by the fact
		// that old tokens are continuously removed, and therefore this query won't be terribly expensive
		// this is a tradeoff made in favor of maintaining an index for this one case
		await this.collection.deleteByQuery(
			{ userId, isInviteCode: true },
			{ overrideHintRequired: true }
		);
	}

	// insert a signup token record
	async _insert (tokenData, options) {
		await this.remove(tokenData.token);
		return await this.collection.create(tokenData, options);
	}

	// find a signup token record by token, 
	// return null if no token record was found,
	// otherwise return the userId and whether the token is expired
	async _find (token, options) {
		options = Object.assign({}, options, { hint: Indexes.byToken });
		const tokens = await this.collection.getByQuery({ token }, options);
		const tokenData = tokens[0];
		if (!tokenData) {
			return null;
		}
		tokenData.expired = tokenData.expiresAt < Date.now();
		return tokenData;
	}

}

module.exports = SignupTokens;