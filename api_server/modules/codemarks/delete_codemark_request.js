// handle the DELETE /codemarks request to delete (deactivate) a codemark,
// along with associated post and markers

'use strict';

const DeleteRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/delete_request');
const PostDeleter = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/post_deleter');

class DeleteCodemarkRequest extends DeleteRequest {

	// authorize the request for the current user
	async authorize () {
		// get the codemark, only the author or the team admin can delete it
		const codemarkId = this.request.params.id.toLowerCase();
		this.codemark = await this.data.codemarks.getById(codemarkId);
		if (!this.codemark) {
			throw this.errorHandler.error('notFound', { info: 'codemark' });
		}
		this.team = await this.data.teams.getById(this.codemark.get('teamId'));
		if (!this.team) {
			throw this.errorHandler.error('notFound', { info: 'team' });	// really shouldn't happen
		}

		// note, even though we allow the author to update the codemark, the author might still have been
		// removed from the team, hence this check first
		if (!this.user.hasTeam(this.codemark.get('teamId'))) {
			throw this.errorHandler.error('deleteAuth', { reason: 'user must be on the team that owns the codemark' });
		}

		if (
			this.codemark.get('creatorId') !== this.user.id &&
			!(this.team.get('adminIds') || []).includes(this.user.id)
		) {
			throw this.errorHandler.error('deleteAuth', { reason: 'only the author or a team admin can delete the codemark' });
		}
	}

	async process () {
		if (this.codemark.get('providerType')) {
			throw this.errorHandler.error('deleteAuth', { reason: 'can not delete third-party provider codemark' });
		}

		// use a post deleter to delete the codemark's referencing post,
		// this will end up deleting the codemark and its markers
		this.postDeleter = new PostDeleter({
			request: this
		});
		await this.postDeleter.deletePost(this.codemark.get('postId'));
	}

	async handleResponse () {
		if (this.gotError) {
			return super.handleResponse();
		}

		await this.postDeleter.handleResponse(this.responseData);
		await super.handleResponse();
	}

	// after the codemark is deleted...
	async postProcess () {
		return await this.postDeleter.postProcess();
	}

	// describe this route for help
	static describe (module) {
		const description = DeleteRequest.describe(module);
		description.access = 'Must be the creator of the codemark, or an admin';
		description.returns = {
			summary: 'Returns the codemark with a directive to set deactivated flag to true, as well as any associated post or markers',
			looksLike: {
				codemark: {
					id: '<ID of the codemark>',
					$set: {
						deactivated: true
					}
				},
				post: {
					id: '<ID of associated post>',
					$set: {
						deactivated: true
					}
				},
				markers: [{
					id: '<ID of associated marker>',
					$set: {
						deactivated: true
					}
				}]
			}
		};
		description.publishes = 'Same as response, published to the stream that owns the codemark, or the team if third-party provider is used';
		description.errors.push('alreadyDeleted');
		return description;
	}
}

module.exports = DeleteCodemarkRequest;
