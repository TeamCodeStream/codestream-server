// handle the DELETE /code-errors request to delete (deactivate) a code error,
// along with the associated post 

'use strict';

const DeleteRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/delete_request');
const PostDeleter = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/post_deleter');

class DeleteCodeErrorRequest extends DeleteRequest {

	// authorize the request for the current user
	async authorize () {
		// get the code error, only the author or the team admin can delete it
		const codeErrorId = this.request.params.id.toLowerCase();
		this.codeError = await this.user.authorizeCodeError(codeErrorId, this);

		// only an admin or the code error creator can delete it
		let isAdmin = false;
		if (this.codeError && this.codeError.get('teamId')) {
			const team = await this.data.teams.getById(this.codeError.get('teamId'));
			if (team && team.get('adminIds').includes(this.user.id)) {
				isAdmin = true;
			} 
		
		}
		if (
			!this.codeError || 
			(
				!isAdmin &&
				this.codeError.get('creatorId') !== this.user.id
			)
		) {
			throw this.errorHandler.error('deleteAuth', { reason: 'only the creator or a team admin can delete a code error' });
		}
	}

	async process () {
		// use a post deleter to delete the code error's referencing post
		// this will end up deleting the code error and all its replies and codemarks and markers,
		// the whole shebang!
		this.postDeleter = new PostDeleter({
			request: this
		});
		await this.postDeleter.deletePost(this.codeError.get('postId'));
	}

	async handleResponse () {
		if (this.gotError) {
			return super.handleResponse();
		}

		await this.postDeleter.handleResponse(this.responseData);
		await super.handleResponse();
	}

	// after the code error is deleted...
	async postProcess () {
		return await this.postDeleter.postProcess();
	}

	// describe this route for help
	static describe (module) {
		const description = DeleteRequest.describe(module);
		description.access = 'Must be the creator of the code error, or an admin';
		description.returns = {
			summary: 'Returns the code error with a directive to set deactivated flag to true, as well as any associated post',
			looksLike: {
				codeError: {
					id: '<ID of the code error>',
					$set: {
						deactivated: true
					}
				},
				post: {
					id: '<ID of associated post>',
					$set: {
						deactivated: true
					}
				}
			}
		};
		description.publishes = 'Same as response, published to the stream that owns the code error, or the team';
		description.errors.push('alreadyDeleted');
		return description;
	}
}

module.exports = DeleteCodeErrorRequest;
