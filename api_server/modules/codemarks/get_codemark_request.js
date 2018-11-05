// handle a GET /codemarks/:id request to fetch a single codemark

'use strict';

const GetRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_request');

class GetCodemarkRequest extends GetRequest {

	async process () {
		await super.process();
		await this.getPost();		// get the post pointing to this codemark, if any
		await this.getMarkers();	// get the markers referenced by this codemark, if any
	}

	// get the post pointing to this codemark, if any
	async getPost () {
		// don't retrieve posts for third-party codemarks
		if (this.model.get('providerType')) { 
			return;
		}
		const postId = this.model.get('postId');
		if (!postId) { return; }
		const post = await this.data.posts.getById(postId);
		if (!post) {
			throw this.errorHandler.error('notFound', { info: 'post' });
		}
		this.responseData.post = post.getSanitizedObject();
	}

	// get the markers referenced by this codemark, if any
	async getMarkers () {
		const markerIds = this.model.get('markerIds') || [];
		if (markerIds.length === 0) { return; }
		const markers = await this.data.markers.getByIds(markerIds);
		this.responseData.markers = markers.map(marker => marker.getSanitizedObject());
	}

	// describe this route for help
	static describe (module) {
		const description = GetRequest.describe(module);
		description.description = 'Returns the codemark; also returns the referencing post, if any, as well as any markers referenced by the codemark';
		description.access = 'User must be a member of the stream that owns the codemark';
		description.returns.summary = 'An codemark object, along with any referencing post and referenced markers',
		Object.assign(description.returns.looksLike, {
			codemark: '<the fetched @@#codemark object#codemark@@>',
			post: '<the @@#post object#post@@ that references this codemark, if any>',
			markers: '<any code @@#markers#marker@@ referenced by this codemark>'
		});
		return description;
	}
}

module.exports = GetCodemarkRequest;
