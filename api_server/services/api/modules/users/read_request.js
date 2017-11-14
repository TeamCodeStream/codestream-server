'use strict';

var Restful_Request = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');

class Read_Request extends Restful_Request {

	authorize (callback) {
		let stream_id = this.request.params.stream_id.toLowerCase();
		if (stream_id === 'all') {
			// all doesn't need authorization, it applies only to the current user
			return callback();
		}
		return this.user.authorize_stream(
			stream_id,
			this,
			(error, authorized) => {
				if (error) { return callback(error); }
				if (!authorized) {
					return callback(this.error_handler.error('update_auth', { reason: 'user not in stream' }));
				}
				process.nextTick(callback);
			}
		);
	}

	process (callback) {
		this.stream_id = this.request.params.stream_id.toLowerCase();
		if (this.stream_id === 'all') {
			this.op = {
				unset: {
					last_reads: true
				}
			};
		}
		else {
			this.op = {
				unset: {
					['last_reads.' + this.stream_id]: true
				}
			};
		}
		this.data.users.apply_op_by_id(
			this.user.id,
			this.op,
			callback
		);
	}

	post_process (callback) {
		let channel = 'user-' + this.user.id;
		let message = {
			user: {
				_id: this.user.id
			},
			request_id: this.id
		};
		Object.assign(message.user, this.op);
		this.api.services.messager.publish(
			message,
			channel,
			error => {
				if (error) {
					this.warn(`Unable to publish last_reads message to channel ${channel}: ${JSON.stringify(error)}`);
				}
				callback();
			}
		);
	}
}

module.exports = Read_Request;
