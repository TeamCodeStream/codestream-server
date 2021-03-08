// handle the "PUT /read-item/:postId" request to establish the number of replies read for the
// item (codemark or review) associated with a post

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request.js');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');

class ReadItemRequest extends RestfulRequest {

	// authorize the request before processing....
	async authorize () {
		// they must have read access to the post, meaning it's in a stream they have access to
		const postId = this.request.params.postId.toLowerCase();
		this.post = await this.user.authorizePost(postId, this);
		if (!this.post) {
			throw this.errorHandler.error('updateAuth', { reason: 'user does not have access to this post' });
		}
	}

	// process the request...
	async process () {
		await this.requireAndAllow();

		// set the lastReadItems value for the post
		const op = {
			$set: {
				[`lastReadItems.${this.post.id}`]: this.request.body.numReplies,
				modifiedAt: Date.now()
			}
		};
		this.updateOp = await new ModelSaver({
			request: this,
			collection: this.data.users,
			id: this.user.id
		}).save(op);
	}

	// require these parameters, and discard any unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters(
			'body',
			{
				required: {
					number: ['numReplies']
				}
			}
		);
	}

	// handle the response to the request
	async handleResponse () {
		if (this.gotError) {
			return await super.handleResponse();
		}
		this.responseData = { user: this.updateOp };
		super.handleResponse();
	}

	// after the response is returned....
	async postProcess () {
		// send the update on the user's me-channel, so other active
		// sessions get the message
		const channel = 'user-' + this.user.id;
		const message = Object.assign({}, this.responseData, { requestId: this.request.id });
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this	}
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate
			this.warn(`Unable to publish lastReadItems message to channel ${channel}: ${JSON.stringify(error)}`);
		}
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'read-item',
			summary: 'Set the number of read replies for a codemark or review for the authenticated user',
			access: 'User must have read access to the given post, meaning they have access to the stream it\'s in',
			description: 'Set the number of read replies for the codemark or review associated with the given post, for the authenticated user',
			input: 'Specify ID of the post in the path, and the number of replies in the request body',
			returns: {
				summary: 'User object with directives indicating how the lastReadItems attribute for the user object should be updated',
				looksLike: {
					user: {
						id: '<ID of the user>',
						$set: {
							lastReadItems: {
								['<post ID>']: '<numReplies as given in the body>'
							}
						}
					}
				}
			},
			publishes: 'Publishes the response to the user\'s me channel',
			errors: [
				'notFound',
				'updateAuth'
			]
		};
	}
}

module.exports = ReadItemRequest;
