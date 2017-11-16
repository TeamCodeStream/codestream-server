'use strict';

var RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');

class ReadRequest extends RestfulRequest {

	authorize (callback) {
		let streamId = this.request.params.streamId.toLowerCase();
		if (streamId === 'all') {
			// all doesn't need authorization, it applies only to the current user
			return callback();
		}
		return this.user.authorizeStream(
			streamId,
			this,
			(error, authorized) => {
				if (error) { return callback(error); }
				if (!authorized) {
					return callback(this.errorHandler.error('updateAuth', { reason: 'user not in stream' }));
				}
				process.nextTick(callback);
			}
		);
	}

	process (callback) {
		this.streamId = this.request.params.streamId.toLowerCase();
		if (this.streamId === 'all') {
			this.op = {
				unset: {
					lastReads: true
				}
			};
		}
		else {
			this.op = {
				unset: {
					['lastReads.' + this.streamId]: true
				}
			};
		}
		this.data.users.applyOpById(
			this.user.id,
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
			}
		);
	}
}

module.exports = ReadRequest;
