// handle a GET /markers/:id request to fetch a single marker

'use strict';

const GetRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_request');

class GetMarkerRequest extends GetRequest {

	async process () {
		await super.process();
		await this.getItem();	// get the parent item
		await this.getPost();	// get the referencing post, if any
	}

	// get the parent item to this marker
	async getItem () {
		const itemId = this.model.get('itemId');
		this.item = await this.data.items.getById(itemId);
		if (!this.item) { return; } // shouldn't happen
		this.responseData.item = this.item.getSanitizedObject();
	}

	// get the post referencing the item that is the parent to this marker, if any
	async getPost () {
		if (this.model.get('providerType')) {
			return;	// only applies to CodeStream posts
		}
		const postId = this.item.get('postId');
		this.post = await this.data.posts.getById(postId);
		if (!this.post) { return; } // shouldn't happen
		this.responseData.post = this.post.getSanitizedObject();
	}

	// describe this route for help
	static describe (module) {
		const description = GetRequest.describe(module);
		description.access = 'User must be a member of the team that owns the file stream to which the marker belongs';
		return description;
	}
}

module.exports = GetMarkerRequest;
