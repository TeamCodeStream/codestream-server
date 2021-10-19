// handle a GET /code-errors/:id request to fetch a single code error

'use strict';

const GetRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/get_request');

class GetCodeErrorRequest extends GetRequest {

	async authorize () {
		const codeErrorId = this.request.params.id.toLowerCase();
		this.codeError = await this.user.authorizeCodeError(codeErrorId, this);
		if (!this.codeError) {
			throw this.errorHandler.error('readAuth', { reason: 'user does not have access to this code error' });
		}
	}

	async process () {
		await super.process();
		await this.getPost();		// get the post pointing to this code error, if any
	}

	// get the post pointing to this code error, if any
	async getPost () {
		const postId = this.model.get('postId');
		if (!postId) { return; }
		const post = await this.data.posts.getById(postId);
		if (!post) {
			throw this.errorHandler.error('notFound', { info: 'post' });
		}
		this.responseData.post = post.getSanitizedObject({ request: this });
	}

	// describe this route for help
	static describe (module) {
		const description = GetRequest.describe(module);
		description.description = 'Returns the code error; also returns the referencing post, if any';
		description.access = 'User must be a member of the stream that owns the code error';
		description.returns.summary = 'A code error object, along with any referencing post',
		Object.assign(description.returns.looksLike, {
			codeError: '<the fetched @@#code error object#codeError@@>',
			post: '<the @@#post object#post@@ that references this code error, if any>'
		});
		return description;
	}
}

module.exports = GetCodeErrorRequest;
