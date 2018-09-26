// handle the PUT /react/:id request to react to a post

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
const PostPublisher = require('./post_publisher');
const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');

class ReactRequest extends RestfulRequest {

	// authorize the request for the current user
	async authorize () {
		this.post = await this.user.authorizePost(this.request.params.id, this);
		if (!this.post) {
			throw this.errorHandler.error('updateAuth', { reason: 'must be a member of the stream' });
		}
	}

	// process the request...
	async process () {
		await this.validate();			// validate the input
		await this.updateReactions();	// update the reactions stored with the post
	}

	// validate the input
	async validate () {
		const reactions = Object.keys(this.request.body);
		if (reactions.length > 10) {
			throw this.errorHandler.error('invalidParameter', { reason: 'there can be no more than 10 reactions at once' });
		}
		if (reactions.find(reaction => reaction.match(/[$.]/))) {
			throw this.errorHandler.error('invalidParameter', { reason: 'reactions can not contain . or $' });
		}
		if (reactions.find(reaction => ![true, false].includes(this.request.body[reaction]))) {
			throw this.errorHandler.error('invalidParameter', { reason: 'reaction values must be boolean' });
		}
	}

	// update the reactions as stored with the post
	async updateReactions () {
		const reactions = Object.keys(this.request.body);
		if (reactions.length === 0) {
			return;
		}
		const op = {};
		reactions.forEach(reaction => {
			if (this.request.body[reaction]) {
				op.$addToSet = op.$addToSet || {};
				op.$addToSet[`reactions.${reaction}`] = this.user.id;
			}
			else {
				op.$pull = op.$pull || {};
				op.$pull[`reactions.${reaction}`] = this.user.id;
			}
		});
		this.updateOp = await new ModelSaver({
			request: this,
			collection: this.data.posts,
			id: this.post.id
		}).save(op);
	}

	async handleResponse () {
		if (this.gotError) {
			return await super.handleResponse();
		}
		this.responseData = { post: this.updateOp };
		await super.handleResponse();
	}

	// after the post is updated...
	async postProcess () {
		await this.publishUpdate();
	}

	// publish the update to the appropriate messager channel
	async publishUpdate () {
		const stream = await this.data.streams.getById(this.post.get('streamId'));
		if (!stream) {
			return;	// failsafe, should never really happen
		}
		await new PostPublisher({
			data: this.responseData,
			request: this,
			messager: this.api.services.messager,
			stream: stream.attributes
		}).publishPost();
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'react',
			summary: 'React to a post',
			access: 'User must be a member of the stream (for channel and direct streams), or of the team (for team-streams).',
			description: 'React to a post, setting a reaction for the current user; a reaction can also be cleared.',
			input: {
				summary: 'Specify the ID of the post in the path; the reactions are keys in the body, and the values are true/false to set or clear the reaction',
				looksLike: {
					'<some reaction type>': 'true|false',
					'<some other reaction type>': 'true|false',
					'...': '...'
				}
			},
			returns: 'A post object, with a directive indicating how to update the post\'s reactions attribute',
			publishes: 'The response data will be published on the stream channel for the stream, or on the team channel for team-streams',
			errors: [
				'updateAuth',
				'notFound',
				'invalidParameter'
			]
		};
	}
}

module.exports = ReactRequest;
