// handle the POST /posts request to create a new post

'use strict';

const PostRequest = require(process.env.CS_API_TOP + '/lib/util/restful/post_request');

class PostPostRequest extends PostRequest {

	// authorize the request for the current user
	async authorize () {
		const streamId = this.request.body.streamId;
		if (!streamId) {
			return this.errorHandler.error('parameterRequired', { info: 'streamId' });
		}
		const authorized = await this.user.authorizeStream(streamId.toLowerCase(), this);
		if (!authorized) {
			return this.errorHandler.error('createAuth');
		}
	}

	/* eslint complexity: 0 */
	async handleResponse () {
		if (this.gotError) {
			return super.handleResponse();
		}
		const { transforms, responseData } = this;
		if (transforms.createdRepos && transforms.createdRepos.length > 0) {
			responseData.repos = transforms.createdRepos.map(repo => repo.getSanitizedObject());
		}
		if (transforms.repoUpdates && transforms.repoUpdates.length > 0) {
			responseData.repos = [
				...(responseData.repos || []),
				...transforms.repoUpdates
			];
		}
		if (transforms.createdStreamsForMarkers && transforms.createdStreamsForMarkers.length > 0) {
			responseData.streams = transforms.createdStreamsForMarkers.map(stream => stream.getSanitizedObject());
		}

		if (transforms.streamUpdateForPost) {
			responseData.streams = [
				...(responseData.streams || []),
				transforms.streamUpdateForPost
			];
		}
		if (transforms.markerUpdates) {
			responseData.markers = transforms.markerUpdates;
		}
		if (transforms.createdMarkers && transforms.createdMarkers.length > 0) {
			responseData.markers = [
				...(responseData.markers || []),
				...transforms.createdMarkers.map(marker => marker.getSanitizedObject())
			];
		}
		if (transforms.markerLocations && transforms.markerLocations.length > 0) {
			responseData.markerLocations = transforms.markerLocations;
		}
		if (transforms.createdItem) {
			responseData.item = transforms.createdItem.getSanitizedObject();
		}
		if (transforms.postUpdate) {
			responseData.posts = [transforms.postUpdate];
		}
		if (transforms.itemUpdate) {
			responseData.items = [transforms.itemUpdate];
		}
		await super.handleResponse();
	}

	// describe this route for help
	static describe (module) {
		const description = PostRequest.describe(module);
		description.description = 'Creates a post, along with associated markers, and associated knowledge base items. Streams can also be created on-the-fly, either for the post, or for any markers it quotes.';
		description.access = 'For posts in a file stream, the current user must be a member of the team to which the file stream belongs. For posts in a channel stream or a direct stream, the current user must be a member of the stream.';
		description.input = {
			summary: description.input,
			looksLike: {
				'streamId*': '<ID of the stream in which the post is being created, required unless a stream object is specified>',
				'text': '<Text of the post>',
				'parentPostId': '<For replies, the ID of the parent post>',
				'items': '<Array of @@#items#item@@, for creating knowledge-base item referenced by the post>',
				'mentionedUserIds': '<Array of IDs representing users mentioned in the post>'
			}
		};
		description.returns.summary = 'A post object, plus a stream object if a stream was created on-the-fly, marker objects and marker locations for any markers';
		Object.assign(description.returns.looksLike, {
			stream: '<@@#stream object#stream@@ > (if stream created on-the fly for the post)>',
			streams: [
				'<@@#stream object#stream@@ > (additional streams created on-the-fly for markers)>',
				'...'
			],
			items: [
				'<@@#item object#item@@ > (knowledge base items referenced by this post)>',
				'...'
			],
			markers: [
				'<@@#marker object#marker@@ > (marker objects associated with quoted markers)',
				'...'
			],
			markerLocations: '<@@#marker locations object#markerLocations@@ > (marker locations for markers associated with quoted markers)'
		});
		description.publishes = {
			summary: 'If the post was created in a file stream or a team stream (a channel with all members of the team), then the post object will be published to the team channel; otherwise it will be published to the stream channel for the stream in which it was created.',
			looksLike: {
				post: '<@@#post object#post@@>',
				stream: '<@@#stream object#stream@@ > (if stream created on-the fly for the post)>',
				streams: [
					'<@@#stream object#stream@@ > (additional streams created on-the-fly for markers)>',
					'...'
				],
				items: [
					'<@@#item object#item@@ > (knowledge base items referenced by the post)',
					'...'
				],
				markers: [
					'<@@#marker object#marker@@ > (marker objects associated with quoted markers)',
					'...'
				],
				markerLocations: '<@@#marker locations object#markerLocations@@ > (marker locations for markers associated with quoted markers)'
			}
		};
		return description;
	}
}

module.exports = PostPostRequest;
