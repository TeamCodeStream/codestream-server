// handle a GET /markers/:id request to fetch a single marker

'use strict';

const GetRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_request');

class GetMarkerRequest extends GetRequest {

	async process () {
		await super.process();
		await this.getCodemark();	// get the parent codemark
		await this.getPost();	// get the referencing post, if any
	}

	// get the parent codemark to this marker
	async getCodemark () {
		const codemarkId = this.model.get('codemarkId');
		this.codemark = await this.data.codemarks.getById(codemarkId);
		if (!this.codemark) { return; } // shouldn't happen
		this.responseData.codemark = this.codemark.getSanitizedObject();
	}

	// get the post referencing the codemark that is the parent to this marker, if any
	async getPost () {
		if (this.model.get('providerType')) {
			return;	// only applies to CodeStream posts
		}
		const postId = this.codemark.get('postId');
		this.post = await this.data.posts.getById(postId);
		if (!this.post) { return; } // shouldn't happen
		this.responseData.post = this.post.getSanitizedObject();
	}

	// describe this route for help
	static describe (module) {
		const description = GetRequest.describe(module);
		description.access = 'User must be a member of the team that owns the file stream to which the marker belongs';
		description.description = 'Returns the marker; also returns the referencing codemark as well as the referencing post, if any';
		description.returns.summary = 'An marker object, along with the referencing post, if any, and referencing codemark',
		Object.assign(description.returns.looksLike, {
			marker: '<the fetched @@#marker object#marker@@>',
			codemark: '<the @@#codemark object#codemark@@ that references this marker>',
			post: '<the @@#post object#post@@ that references this marker, if any>'
		});
		return description;
	}
}

module.exports = GetMarkerRequest;
