// handle a GET /posts/:id request to fetch a single post

'use strict';

const GetRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/get_request');

class GetPostRequest extends GetRequest {

	async process () {
		await super.process();
		await this.getCodemark();	// get the knowledge base codemark referenced by this post, if any
		await this.getReview();		// get the code review object referenced by this post, if any
		await this.getMarkers();	// get the markers referenced by this post, if any
	}

	// get the codemark referenced by this post, if any
	async getCodemark () {
		const codemarkId = this.model.get('codemarkId');
		if (!codemarkId) { return; }
		this.codemark = await this.data.codemarks.getById(codemarkId);
		if (!this.codemark) { return; }
		this.responseData.codemark = this.codemark.getSanitizedObject({ request: this });
	}

	// get the code review referenced by this post, if any
	async getReview () {
		const reviewId = this.model.get('reviewId');
		if (!reviewId) { return; }
		this.review = await this.data.reviews.getById(reviewId, { excludeFields: ['reviewDiffs', 'checkpointReviewDiffs'] });
		if (!this.review) { return; }
		this.responseData.review = this.review.getSanitizedObject({ request: this });
	}

	// get the markers referenced by this post, if any
	async getMarkers () {
		let codemarkMarkerIds = [];
		let reviewMarkerIds = [];
		if (this.codemark) {
			codemarkMarkerIds = this.codemark.get('markerIds') || [];
		}
		if (this.review) {
			reviewMarkerIds = this.review.get('markerIds') || [];
		}
		const markerIds = [...codemarkMarkerIds, ...reviewMarkerIds];
		if (markerIds.length === 0) { return; }
		const markers = await this.data.markers.getByIds(markerIds);
		this.responseData.markers = markers.map(marker => marker.getSanitizedObject({ request: this }));
	}

	// describe this route for help
	static describe (module) {
		const description = GetRequest.describe(module);
		description.access = 'For posts in a file stream, user must be a member of the team that owns the file stream; for other streams, user must be a member of the stream';
		description.description = 'Returns the post; also returns the knowledge-base codemark referenced by this post, if any, as well as any markers referenced by the codemark';
		description.access = 'User must be a member of the stream that owns the codemark';
		description.returns.summary = 'A post object, along with any referenced codemark and markers',
		Object.assign(description.returns.looksLike, {
			post: '<the fetched @@#post object#post@@>',
			codemark: '<the @@#codemark object#codemark@@ referenced by this post, if any>',
			review: '<the @@#code review object#review@@ referenced by this post, if any>',
			markers: '<any code @@#markers#markers@@ referenced by the codemark>'
		});
		return description;
	}
}

module.exports = GetPostRequest;
