// provides a request class for handling the PUT /open request,
// for users to "open" previously closed streams (for themselves) 

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');

class OpenRequest extends RestfulRequest {

	// authorize the current user against the request
	async authorize () {
		// get the stream
		this.stream = await this.data.streams.getById(this.request.params.id);
		if (!this.stream) {
			throw this.errorHandler.error('notFound', { info: 'stream' });
		}
        
		// only direct streams can be opened
		if (this.stream.get('type') !== 'direct') {
			throw this.errorHandler.error('updateAuth', { reason: 'only direct streams can be opened' });
		}

		const authorized = await this.request.user.authorizeStream(this.request.params.id, this);
		if (!authorized) {
			throw this.errorHandler.error('updateAuth', { reason: 'only members can open this stream' });
		}
	}

	// process the request...
	async process () {
		// update the user's preferences to indicate the stream is no longer closed
		const op = {
			$unset: {
				[`preferences.closedStreams.${this.stream.id}`]: true
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
				$unset: {
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
			tag: 'open',
			summary: 'Open a previously closed direct stream for the current user',
			access: 'User must be a member of the stream',
			description: 'Set the indicated direct stream as open for the current user. This is really an update to the user\'s preferences, not the stream itself.',
			input: 'Specify the stream ID in the path',
			returns: {
				summary: 'A user directive indicating how to update the user preferences, and a stream directive indicating to unset the "isClosed" flag on the stream. Note that the stream update does not reflect a global change to the stream object, it only applies for the current user.',
				looksLike: {
					user: '<Directive to update the user preferences>',
					stream: '<Directive to unset isClosed for the stream>'
				}
			},
			publishes: 'Same as the response, sent on the user channel for the user',
			errors: [
				'updateAuth'
			]
		};
	}
}

module.exports = OpenRequest;
