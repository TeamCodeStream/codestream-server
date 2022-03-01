// handle the "PUT /preferences" request to update the user's preferences object

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request');
const { opFromHash } = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/data_collection/model_ops');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');

const MAX_KEYS = 100;

class PutPreferencesRequest extends RestfulRequest {

	async authorize () {
		// only applies to current user, no authorization required
	}

	// process the request...
	async process () {
		// determine the update op based on the request body, and apply it if valid
		this.totalKeys = 0;
		const op = opFromHash(this.request.body, 'preferences', MAX_KEYS);
		if (typeof op === 'string') {
			throw this.errorHandler.error('invalidParameter', { info: op });
		}
		op.$set = op.$set || {};
		op.$set.modifiedAt = Date.now();
		this.updateOp = await new ModelSaver({
			request: this,
			collection: this.data.users,
			id: this.user.id
		}).save(op);
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
			(
				this.gotError.reason.name === 'MongoServerError' ||
				this.gotError.reason.name === 'MongoError'
			)
		) {
			this.warn(JSON.stringify(this.gotError));
			this.gotError = this.errorHandler.error('invalidParameter');
		}
		if (this.gotError) {
			return await super.handleResponse();
		}
		this.responseData = { user: this.updateOp };
		await super.handleResponse();
	}

	// after the response is returned....
	async postProcess () {
		// send the message to the user's me-channel, so other sessions know that the
		// preferences have been updated
		const channel = 'user-' + this.user.id;
		const message = Object.assign({}, this.responseData, { requestId: this.request.id });
		try {
			await this.api.services.broadcaster.publish(
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

	// describe this route for help
	static describe () {
		return {
			tag: 'put-preferences',
			summary: 'Update a user\'s preferences',
			access: 'The current user can only update their own preferences',
			description: 'Updates a user\'s preferences object, which is a free-form object, with arbitrary levels of nesting. Only the values specified in the request body will be updated; other values in the preferences object will remain unchanged. $set and $unset directives can be used at any nesting level to set or unset a value, respectively.',
			input: 'Specify values to set, up to an arbitrary level of nesting, in the request body.',
			returns: {
				summary: 'A user object with directives appropriate for updating the user\'s preferences',
				looksLike: {
					user: {
						id: '<ID of the user>',
						preferences: {
							'<some preferences value>': '<some directive>',
							'...': '...'
						}
					}
				}
			},
			publishes: {
				summary: 'Publishes a user object, with directives corresponding to the request body passed in, to the user\'s user channel, indicating how the preferences object for the user object should be updated.',
				looksLike: {
					user: {
						id: '<ID of the user>',
						preferences: {
							'<some preferences value>': '<some directive>',
							'...': '...'
						}
					}
				}
			},
			errors: [
				'invalidParameter'
			]
		};
	}
}

module.exports = PutPreferencesRequest;
