// handle the "PUT /preferences" request to update the user's preferences object

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');

const MAX_KEYS = 100;

class PutPreferencesRequest extends RestfulRequest {

	async authorize () {
		// only applies to current user, no authorization required
	}

	// process the request...
	async process () {
		// determine the update op based on the request body, and apply it if valid
		this.totalKeys = 0;
		this.op = this.opFromBody();
		if (typeof this.op === 'string') {
			throw this.errorHandler.error('invalidParameter', { info: this.op });
		}
		await this.data.users.applyOpById(
			this.request.user.id,
			this.op
		);
	}

	// after the response is returned....
	async postProcess () {
		// send the message to the user's me-channel, so other sessions know that the
		// preferences have been updated
		const channel = 'user-' + this.user.id;
		let message = {
			user: {
				_id: this.user.id
			},
			requestId: this.request.id
		};
		Object.assign(message.user, this.op);
		try {
			await this.api.services.messager.publish(
				message,
				channel,
				{ request: this }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate
			this.warn(`Unable to publish preferences message to channel ${channel}: ${JSON.stringify(error)}`);
		}
	}

	// extract the database op to perform based on the passed body
	opFromBody () {
		// the body can be a multi-level json object, but we'll update the database
		// using mongo's dot-notation
		let op = {};
		let root = 'preferences.';
		for (let key in this.request.body) {
			if (this.request.body.hasOwnProperty(key)) {
				let error = this._handleTopLevelKey(key, op, root);
				if (error) { return error; }
			}
		}
		return op;
	}

	// handle the top-level key in the preferences object (request body)
	_handleTopLevelKey (key, op, root) {
		this.totalKeys++;
		if (this.totalKeys === MAX_KEYS) {
			// we have a limit on the number of keys that can be updated in one
			// request, just as a safeguard
			return 'too many keys';
		}
		if (key.startsWith('$')) {
			// a command directive like $set or $unset
			return this._handleDirective(key, op, root);
		}
		else {
			// an ordinary "set"
			return this._handleNonDirective(key, op, root);
		}
	}

	// handle a directive encountered in the request body, translating it into
	// the op to pass in the database update operation
	_handleDirective (key, op, root) {
		let value = this.request.body[key];
		if (typeof value !== 'object') {
			return key;
		}
		let subOp = this._flattenOp(value, root);
		op[key] = op[key] || {};
		Object.assign(op[key], subOp);
	}

	// handle a normal field value encountered, and translate into the op
	// to pass in the database update operation
	_handleNonDirective (key, op, root) {
		op.$set = op.$set || {};
		let subRoot = `${root}${key}.`;
		let value = this.request.body[key];
		if (typeof value === 'object') {
			let subOp = this._flattenOp(value, subRoot);
			if (typeof subOp === 'string') {
				return subOp;	// error
			}
			Object.assign(op.$set, subOp);

		}
		else {
			op.$set[root + key] = value;
		}
	}

	// given an update object with nested levels, translate into an update operation
	// using mongo's dot notation to separate keys from sub-keys
	_flattenOp (value, root) {
		let op = {};
		for (let key in value) {
			if (value.hasOwnProperty(key)) {
				this.totalKeys++;
				if (this.totalKeys === MAX_KEYS) {
					// we have a limit on the number of keys that can be updated in one
					// request, just as a safeguard
					return 'too many keys';
				}
				let subValue = value[key];
				if (typeof subValue === 'object') {
					let subRoot = `${root}${key}.`;
					let subOp = this._flattenOp(subValue, subRoot);
					if (typeof subOp === 'string') {
						return subOp;	// error
					}
					Object.assign(op, subOp);
				}
				else {
					op[root + key] = subValue;
				}
			}
		}
		return op;
	}

	// handle returning the response
	async handleResponse () {
		// we have a special case for an error writing to the database ... rather
		// than return some vague internal error that we normally would on a database
		// error, inform the client that the provided parameter was invalid
		if (
			this.gotError &&
			this.gotError.code === 'MDTA-1000' &&
			typeof this.gotError.reason === 'object' &&
			this.gotError.reason.name === 'MongoError'
		) {
			this.warn(JSON.stringify(this.gotError));
			this.gotError = this.errorHandler.error('invalidParameter');
		}
		await super.handleResponse();
	}
}

module.exports = PutPreferencesRequest;
