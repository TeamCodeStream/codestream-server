// handle a GET /reviews/:id request to fetch a single review

'use strict';

const GetRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_request');

class GetReviewRequest extends GetRequest {

	async process () {
		await super.process();
		await this.getPost();		// get the post pointing to this review, if any
	}

	// get the post pointing to this review, if any
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
		description.description = 'Returns the review; also returns the referencing post, if any';
		description.access = 'User must be a member of the stream that owns the review';
		description.returns.summary = 'A review object, along with any referencing post',
		Object.assign(description.returns.looksLike, {
			review: '<the fetched @@#review object#review@@>',
			post: '<the @@#post object#post@@ that references this review, if any>'
		});
		return description;
	}
}

module.exports = GetReviewRequest;
