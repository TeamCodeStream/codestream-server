// provides a request class for handling the PUT /close request,
// for users to "close" streams (for themselves) 

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');

class CloseRequest extends RestfulRequest {

	// authorize the current user against the request
	async authorize () {
		// get the stream
		this.stream = await this.data.streams.getById(this.request.params.id);
		if (!this.stream) {
			throw this.errorHandler.error('notFound', { info: 'stream' });
		}
        
		// only direct streams can be closed
		if (this.stream.get('type') !== 'direct') {
			throw this.errorHandler.error('updateAuth', { reason: 'only direct streams can be closed' });
		}

		const authorized = await this.request.user.authorizeStream(this.request.params.id, this);
		if (!authorized) {
			throw this.errorHandler.error('updateAuth', { reason: 'only members can close this stream' });
		}
	}

	// process the request...
	async process () {
		// update the user's preferences to indicate the stream is "closed"
		const op = {
			$set: {
				[`preferences.closedStreams.${this.stream.id}`]: true,
				modifiedAt: Date.now()
			}
		};
		this.transforms.updateOp = await new ModelSaver({
			request: this.request,
			collection: this.data.users,
			id: this.user.id
		}).save(op);
	}

	// form the response to the request
	async handleResponse () {
		if (this.gotError) {
			return super.handleResponse();
		}
		this.responseData = {
			user: this.transforms.updateOp,
			stream: {	// note, this stream update only applies for the current user
				_id: this.stream.id,	// DEPRECATE ME
				id: this.stream.id,
				$set: {
					isClosed: true
				}
			}
		};
		await super.handleResponse();
	}

	// after the response is sent...
	async postProcess () {
		// send message on the user's channel
		const channel = `user-${this.user.id}`;
		const message = Object.assign({}, this.responseData, { requestId: this.request.id });
		try {
			await this.api.services.messager.publish(
				message,
				channel,
				{ request: this }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.request.warn(`Could not publish preferences update message to user ${this.user.id}: ${JSON.stringify(error)}`);
		}
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'close',
			summary: 'Close a direct stream for the current user',
			access: 'User must be a member of the stream',
			description: 'Set the indicated direct stream as closed for the current user. This is really an update to the user\'s preferences, not the stream itself.',
			input: 'Specify the stream ID in the path',
			returns: {
				summary: 'A user directive indicating how to update the user preferences, and a stream directive indicating to set the "isClosed" flag on the stream. Note that the stream update does not reflect a global change to the stream object, it only applies for the current user.',
				looksLike: {
					user: '<Directive to update the user preferences>',
					stream: '<Directive to set isClosed for the stream>'
				}
			},
			publishes: 'Same as the response, sent on the user channel for the user',
			errors: [
				'updateAuth'
			]
		};
	}
}

module.exports = CloseRequest;
