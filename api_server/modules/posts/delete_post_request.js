// handle the DELETE /posts request to delete (deactivate) a post

'use strict';

const DeleteRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/delete_request');

class DeletePostRequest extends DeleteRequest {

	// authorize the request for the current user
	async authorize () {
		// make sure the user has access to the post, note that even though we also check that they
		// are they author of the post (below), they still need to be an active member of the team
		// (they might have been removed, in which case they should no longer be able to edit)
		this.post = await this.user.authorizePost(this.request.params.id, this);
		if (!this.post) {
			throw this.errorHandler.error('deleteAuth', { reason: 'the user does not have access to this post' });
		}

		this.team = await this.data.teams.getById(this.post.get('teamId'));
		if (!this.team) {
			throw this.errorHandler.error('notFound', { info: 'team' });	// really shouldn't happen
		}

		if (
			this.post.get('creatorId') !== this.user.id &&
			(
				!this.team ||
				!(this.team.get('adminIds') || []).includes(this.user.id)
			)
		) {
			throw this.errorHandler.error('deleteAuth', { reason: 'only the post author or a team admin can delete the post' });
		}
	}

	async handleResponse () {
		if (this.gotError) {
			return super.handleResponse();
		}

		await this.deleter.handleResponse(this.responseData);
		await super.handleResponse();
	}

	// after the post is deleted...
	async postProcess () {
		return this.deleter.postProcess();
	}

	// describe this route for help
	static describe (module) {
		const description = DeleteRequest.describe(module);
		description.access = 'Must be the author of the post, or an admin';
		description.returns = {
			summary: 'Returns the post with a directive to set deactivated flag to true',
			looksLike: {
				post: {
					id: '<ID of the post>',
					$set: {
						deactivated: true
					}
				}
			}
		};
		description.publishes = {
			summary: 'If the post belongs to a file stream or a team stream (a channel with all members of the team), then the post object will be published to the team channel; otherwise it will be published to the stream channel for the stream to which it belongs.',
			looksLike: {
				post: {
					id: '<ID of the post>',
					$set: {
						deactivated: true
					}
				}
			}
		};
		description.errors.push('alreadyDeleted');
		return description;
	}
}

module.exports = DeletePostRequest;
