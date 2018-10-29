// handle a GET /posts/:id request to fetch a single post

'use strict';

const GetRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_request');

class GetPostRequest extends GetRequest {

	async process () {
		await super.process();
		await this.getMarkers();	// get any markers referenced by this post, if any
		await this.getItems();		// get any knowledge base items referenced by this post
	}

	// get the markers referenced by this post, if any
	async getMarkers () {
		const markerIds = this.model.get('markerIds') || [];
		if (markerIds.length === 0) { return; }
		const markers = await this.data.markers.getByIds(markerIds);
		this.responseData.post.markers = markers.map(marker => marker.getSanitizedObject());
	}

	// get the items referenced by this post, if any
	async getItems () {
		const itemIds = this.model.get('itemIds') || [];
		if (itemIds.length === 0) { return; }
		const items = await this.data.items.getByIds(itemIds);
		this.responseData.post.items = items.map(item => item.getSanitizedObject());
	}

	// describe this route for help
	static describe (module) {
		const description = GetRequest.describe(module);
		description.access = 'For posts in a file stream, user must be a member of the team that owns the file stream; for other streams, user must be a member of the stream';
		return description;
	}
}

module.exports = GetPostRequest;
