// handle a GET /posts/:id request to fetch a single post

'use strict';

const GetRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_request');

class GetPostRequest extends GetRequest {

	async process () {
		await super.process();
		await this.getItem();		// get the knowledge base item referenced by this post, if any
		await this.getMarkers();	// get the markers referenced by this post, if any
	}

	// get the item referenced by this post, if any
	async getItem () {
		const itemId = this.model.get('itemId');
		if (!itemId) { return; }
		this.item = await this.data.items.getById(itemId);
		if (!this.item) { return; }
		this.responseData.item = this.item.getSanitizedObject();
	}

	// get the markers referenced by this post, if any
	async getMarkers () {
		if (!this.item) { return; }
		const markerIds = this.item.get('markerIds') || [];
		if (markerIds.length === 0) { return; }
		const markers = await this.data.markers.getByIds(markerIds);
		this.responseData.markers = markers.map(marker => marker.getSanitizedObject());
	}

	// describe this route for help
	static describe (module) {
		const description = GetRequest.describe(module);
		description.access = 'For posts in a file stream, user must be a member of the team that owns the file stream; for other streams, user must be a member of the stream';
		description.description = 'Returns the post; also returns the knowledge-base item referenced by this post, if any, as well as any markers referenced by the item';
		description.access = 'User must be a member of the stream that owns the item';
		description.returns.summary = 'A post object, along with any referenced item and markers',
		Object.assign(description.returns.looksLike, {
			post: '<the fetched @@#post object#post@@>',
			item: '<the @@#item object#item@@ referenced by this post, if any>',
			markers: '<any code @@#markers#markers@@ referenced by the item>'
		});
		return description;
	}
}

module.exports = GetPostRequest;
