// handle the PUT /nr-comments/:id request to edit attributes of a New Relic comment

'use strict';

const NRCommentRequest = require('./nr_comment_request');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');
const Utils = require('./utils');

class PutNRCommentRequest extends NRCommentRequest {

	async process () {
		this.users = [];

		await this.getPost(); 			// get the requested post
		await this.getParentPost();		// get the parent post
		await this.getCodeError();		// get the associated code error
		await this.getTeam();			// get the team that owns the code error
		await this.getMarkers();		// for codemarks, get the associated markers
		await this.getUsers();			// get users associated with the post (creator and mentioned)
		await this.doUpdate();			// do the update

		this.post.attributes.version++;
		this.responseData = {
			post: Utils.ToNewRelic(this.codeError, this.post, this.markers, this.users)
		};
	}

	// get the requested post
	async getPost () {
		const postId = this.request.params.id.toLowerCase();
		this.post = await this.data.posts.getById(postId);
		if (!this.post) {
			throw this.errorHandler.error('notFound', { info: 'post' });
		}
	}

	// get the parent post to the requested post, it is assumed the to-be-modified post is a reply to
	// a post pointing to a code error object
	async getParentPost () {
		const parentPostId = this.post.get('parentPostId');
		if (!parentPostId) {
			throw this.errorHandler.error('readAuth', { reason: 'unable to fetch non-child post' });
		}
		this.parentPost = await this.data.posts.getById(parentPostId);
		if (!this.parentPost) {
			throw this.errorHandler.error('notFound', { info: 'parent post' });
		}
	}

	// get the code error pointed to by the parent post
	async getCodeError () {
		const objectId = this.parentPost.get('codeErrorId');
		if (!objectId) {
			throw this.errorHandler.error('readAuth', { reason: 'parent is not a code error' });
		}
		this.codeError = await this.data.codeErrors.getById(objectId);
		if (!this.codeError) {
			throw this.errorHandler.error('notFound', { info: 'code error'});
		}
		if (this.headerAccountId !== this.codeError.get('accountId')) {
			throw this.errorHandler.error('updateAuth', { reason: 'accountId given in the header does not match the object' });
		}
	}

	// get the team that owns the code error
	async getTeam () {
		this.team = await this.data.teams.getById(this.codeError.get('teamId'));
		if (!this.team || this.team.get('deactivated')) {
			throw this.errorHandler.error('notFound', { info: 'team' });
		}
	}

	// get users associated with the pre-modified post (creator and mentioned)
	// get all users associated with the post, either the creator or those mentioned
	async getUsers () {
		this.users = await this.getUsersByPost(this.post);
	}

	// do the actual update
	async doUpdate () {
		const { text, mentionedUsers } = this.request.body;
		const op = { $set: { } };
		if (this.deactivate) { // set by sub-classed DeleteNRCommentRequest
			op.$set.deactivated = true;
		}
		if (text && typeof text === 'string') {
			op.$set.text = text;
		}
		if (mentionedUsers && mentionedUsers instanceof Array) {
			await this.handleMentions(mentionedUsers);
			op.$set.mentionedUserIds = this.mentionedUserIds;
		}
		if (Object.keys(op.$set).length === 0) {
			return;
		}

		this.updateOp = await new ModelSaver({
			request: this.request,
			collection: this.data.posts,
			id: this.post.id
		}).save(op);
	}

	// perform post-processing after response has been returned
	async postProcess () {
		await this.publish();

		// publish the update to the team
		const teamId = this.post.get('teamId');
		const channel = `team-${teamId}`;
		const message = {
			requestId: this.request.id,
			post: this.updateOp
		};
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.request.warn(`Could not publish NR comment update message to team ${teamId}: ${JSON.stringify(error)}`);
		}
	}
}

module.exports = PutNRCommentRequest;
