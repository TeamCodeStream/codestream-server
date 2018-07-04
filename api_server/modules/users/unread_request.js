// handle the "PUT /unread/:postId" request to mark a post (and all subsequent posts) 
// as unread in a particular stream

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');

class UnreadRequest extends RestfulRequest {

	// authorize the request before processing....
	async authorize () {
		// they must have read access to the post, meaning it's in a stream they have access to
		const postId = this.request.params.postId.toLowerCase();
		this.post = await this.user.authorizePost(postId, this);
		if (!this.post) {
			throw this.errorHandler.error('updateAuth', { reason: 'user does not have access to post' });
		}
	}

	// process the request...
	async process () {
		// set the lastReads value for the post's stream, to the sequence number PRIOR to
		// the sequence number for this post
		const streamId = this.post.get('streamId');
		const seqNum = this.post.get('seqNum') - 1;
		this.op = {
			'$set': {
				['lastReads.' + streamId]: seqNum
			}
		};
		await this.data.users.applyOpById(
			this.user.id,
			this.op
		);
	}

	// after the response is returned....
	async postProcess () {
		// send the lastReads update on the user's me-channel, so other active
		// sessions get the message
		const channel = 'user-' + this.user.id;
		const message = {
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
				{ request: this	}
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate
			this.warn(`Unable to publish lastReads message to channel ${channel}: ${JSON.stringify(error)}`);
		}
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'unread',
			summary: 'Mark the unread point for a stream',
			access: 'User must have read access to the given post, meaning they have access to the stream it\'s in',
			description: 'Mark the unread point for a stream to the given post, all posts going forward from this one are assumed to be unread',
			input: 'Specify ID of the post in the path',
			returns: 'Empty object',
			publishes: {
				summary: 'Publishes a user object, with directives, to the user\'s user channel, indicating how the lastReads attribute for the user object should be updated',
				looksLike: {
					user: {
						_id: '<ID of the user>',
						$set: {
							lastReads: {
								['<streamId of the post>']: '<sequence number of the previous post>'
							}
						}
					}
				}
			},
			errors: [
				'notFound',
				'updateAuth'
			]
		};
	}
}

module.exports = UnreadRequest;
