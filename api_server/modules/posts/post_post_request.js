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
			throw this.errorHandler.error('createAuth');
		}
	}

	/* eslint complexity: 0 */
	async handleResponse () {
		if (this.gotError) {
			return super.handleResponse();
		}

		// handle various data transforms that may have occurred as a result of creating the post,
		// adding objects to the response returned
		const { transforms, responseData } = this;

		// add any repos created for posts with items and markers
		if (transforms.createdRepos && transforms.createdRepos.length > 0) {
			responseData.repos = transforms.createdRepos.map(repo => repo.getSanitizedObject());
		}

		// add any repos updated for posts with items and markers, which may have brought 
		// new remotes into the fold for the repo
		if (transforms.repoUpdates && transforms.repoUpdates.length > 0) {
			responseData.repos = [
				...(responseData.repos || []),
				...transforms.repoUpdates
			];
		}

		// add any file streams created for markers
		if (transforms.createdStreamsForMarkers && transforms.createdStreamsForMarkers.length > 0) {
			responseData.streams = transforms.createdStreamsForMarkers.map(stream => stream.getSanitizedObject());
		}

		// the stream gets updated as a result of the new post, so add that
		if (transforms.streamUpdateForPost) {
			responseData.streams = [
				...(responseData.streams || []),
				transforms.streamUpdateForPost
			];
		}

		// add any markers created 
		if (transforms.createdMarkers && transforms.createdMarkers.length > 0) {
			responseData.markers = [
				...(responseData.markers || []),
				...transforms.createdMarkers.map(marker => marker.getSanitizedObject())
			];
		}

		// markers with locations will have a separate markerLocations object
		if (transforms.markerLocations && transforms.markerLocations.length > 0) {
			responseData.markerLocations = transforms.markerLocations;
		}

		// a knowledge base item might have been created with the post, add it
		if (transforms.createdItem) {
			responseData.item = transforms.createdItem.getSanitizedObject();
		}

		// if there is a parent post update, add it
		if (transforms.postUpdate) {
			responseData.posts = [transforms.postUpdate];
		}

		// if there is a parent item update, add it
		if (transforms.itemUpdate) {
			responseData.items = [transforms.itemUpdate];
		}
		
		await super.handleResponse();
	}

	// describe this route for help
	static describe (module) {
		const description = PostRequest.describe(module);
		description.description = 'Creates a post, along with associated markers, and associated knowledge base items and markers. File streams and repos can also be created on-the-fly for the markers.';
		description.access = 'The current user must be a member of the stream.';
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
		description.returns.summary = 'A post object, plus additional objects that may have been created on-the-fly, marker objects and marker locations for any markers';
		Object.assign(description.returns.looksLike, {
			items: [
				'<@@#item object#item@@ > (knowledge base items referenced by this post)>',
				'...'
			],
			markers: [
				'<@@#marker object#marker@@ > (marker objects associated with quoted markers)',
				'...'
			],
			markerLocations: '<@@#marker locations object#markerLocations@@ > (marker locations for markers associated with quoted markers)',
			streams: [
				'<@@#stream object#stream@@ > (additional streams created on-the-fly for markers)>',
				'...'
			],
			repos: [
				'<@@#repo object#repo@@ > (additional repos created on-the-fly for markers)>',
				'...'
			]
		});
		description.publishes = {
			summary: 'If the post was created in a team stream (a channel with all members of the team), then the post object will be published to the team channel; otherwise it will be published to the stream channel for the stream in which it was created.',
			looksLike: '(same as response)'
		};
		return description;
	}
}

module.exports = PostPostRequest;
