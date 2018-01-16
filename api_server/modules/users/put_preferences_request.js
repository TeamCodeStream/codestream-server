'use strict';

var RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');

const MAX_KEYS = 100;

class PutPreferencesRequest extends RestfulRequest {

	authorize (callback) {
		return callback();
	}

	process (callback) {
		this.totalKeys = 0;
		this.op = this.opFromBody();
		if (typeof this.op === 'string') {
			return callback(this.errorHandler.error('invalidParameter', { info: this.op }));
		}
		this.data.users.applyOpById(
			this.request.user.id,
			this.op,
			callback
		);
	}

	postProcess (callback) {
		let channel = 'user-' + this.user.id;
		let message = {
			user: {
				_id: this.user.id
			},
			requestId: this.request.id
		};
		Object.assign(message.user, this.op);
		this.api.services.messager.publish(
			message,
			channel,
			error => {
				if (error) {
					this.warn(`Unable to publish lastReads message to channel ${channel}: ${JSON.stringify(error)}`);
				}
				callback();
			},
			{
				request: this
			}
		);

	}

	opFromBody () {
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

	_handleTopLevelKey (key, op, root) {
		this.totalKeys++;
		if (this.totalKeys === MAX_KEYS) {
			return 'too many keys';
		}
		if (key.startsWith('$')) {
			return this._handleDirective(key, op, root);
		}
		else {
			return this._handleNonDirective(key, op, root);
		}
	}

	_handleDirective (key, op, root) {
		let value = this.request.body[key];
		if (typeof value !== 'object') {
			return key;
		}
		let subOp = this._flattenOp(value, root);
		op[key] = op[key] || {};
		Object.assign(op[key], subOp);
	}

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

	_flattenOp (value, root) {
		let op = {};
		for (let key in value) {
			if (value.hasOwnProperty(key)) {
				this.totalKeys++;
				if (this.totalKeys === MAX_KEYS) {
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

	handleResponse (callback) {
		if (
			this.gotError &&
			this.gotError.code === 'MDTA-1000' &&
			typeof this.gotError.reason === 'object' &&
			this.gotError.reason.name === 'MongoError'
		) {
			this.warn(JSON.stringify(this.gotError));
			this.gotError = this.errorHandler.error('invalidParameter');
		}
		super.handleResponse(callback);
	}
}

module.exports = PutPreferencesRequest;
