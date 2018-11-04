// handle a GET /items/:id request to fetch a single item

'use strict';

const GetRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_request');

class GetItemRequest extends GetRequest {

	async process () {
		await super.process();
		await this.getPost();		// get the post pointing to this item, if any
		await this.getMarkers();	// get the markers referenced by this item, if any
	}

	// get the post pointing to this item, if any
	async getPost () {
		// don't retrieve posts for third-party items
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

	// get the markers referenced by this item, if any
	async getMarkers () {
		const markerIds = this.model.get('markerIds') || [];
		if (markerIds.length === 0) { return; }
		const markers = await this.data.markers.getByIds(markerIds);
		this.responseData.markers = markers.map(marker => marker.getSanitizedObject());
	}

	// describe this route for help
	static describe (module) {
		const description = GetRequest.describe(module);
		description.description = 'Returns the item; also returns the referencing post, if any, as well as any markers referenced by the item';
		description.access = 'User must be a member of the stream that owns the item';
		description.returns.summary = 'An item object, along with any referencing post and referenced markers',
		Object.assign(description.returns.looksLike, {
			item: '<the fetched @@#item object#item@@>',
			post: '<the @@#post object#post@@ that references this item, if any>',
			markers: '<any code @@#markers#marker@@ referenced by this item>'
		});
		return description;
	}
}

module.exports = GetItemRequest;
