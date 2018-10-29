// handle a GET /markers/:id request to fetch a single marker

'use strict';

const GetRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_request');

class GetMarkerRequest extends GetRequest {

	async process () {
		await super.process();
		await this.getPost();	// get the post referencing this marker, if any
		await this.getItems();	// get the associated items, if any
	}

	// get the post referencing this marker, if any
	async getPost () {
		// don't retrieve posts for third-party markers
		if (this.model.get('providerType')) { 
			return;
		}
		const postId = this.model.get('postId');
		if (!postId) { return; }
		const post = await this.data.posts.getById(postId);
		if (!post) {
			throw this.errorHandler.error('notFound', { info: 'post' });
		}
		this.responseData.marker.post = post.getSanitizedObject();
	}

	// get the items associated with this marker, if any
	async getItems () {
		const itemIds = this.model.get('itemIds') || [];
		if (itemIds.length === 0) { return; }
		const items = await this.data.items.getByIds(itemIds);
		this.responseData.marker.items = items.map(item => item.getSanitizedObject());
	}

	// describe this route for help
	static describe (module) {
		const description = GetRequest.describe(module);
		description.access = 'User must be a member of the team that owns the file stream to which the marker belongs';
		return description;
	}
}

module.exports = GetMarkerRequest;
