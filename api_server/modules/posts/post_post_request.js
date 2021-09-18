// handle the POST /posts request to create a new post

'use strict';

const PostRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/post_request');

class PostPostRequest extends PostRequest {

	// authorize the request for the current user
	async authorize () {
		const streamId = this.request.body.streamId;
		if (!streamId) {
			return this.errorHandler.error('parameterRequired', { info: 'streamId' });
		}
		const stream = await this.user.authorizeStream(streamId.toLowerCase(), this);
		if (!stream) {
			throw this.errorHandler.error('createAuth');
		}

		if (!stream.get('isTeamStream')) {
			throw 'stream channels are deprecated';
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

		// add permalink, if requested
		if (transforms.permalink) {
			responseData.permalink = transforms.permalink;
		}

		// add any repos created for posts with codemarks and markers
		if (transforms.createdRepos && transforms.createdRepos.length > 0) {
			responseData.repos = transforms.createdRepos.map(repo => repo.getSanitizedObject({ request: this }));
		}

		// add any repos updated for posts with codemarks and markers, which may have brought 
		// new remotes into the fold for the repo
		if (transforms.repoUpdates && transforms.repoUpdates.length > 0) {
			responseData.repos = [
				...(responseData.repos || []),
				...transforms.repoUpdates
			];
		}

		// add any file streams created for markers
		if (transforms.createdStreamsForMarkers && transforms.createdStreamsForMarkers.length > 0) {
			responseData.streams = transforms.createdStreamsForMarkers.map(stream => stream.getSanitizedObject({ request: this }));
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
				...transforms.createdMarkers.map(marker => marker.getSanitizedObject({ request: this }))
			];
		}

		// markers with locations will have a separate markerLocations object
		if (transforms.markerLocations && transforms.markerLocations.length > 0) {
			responseData.markerLocations = transforms.markerLocations;
		}

		// a codemark might have been created with the post, add it
		if (transforms.createdCodemark) {
			responseData.codemark = transforms.createdCodemark.getSanitizedObject({ request: this });
		}

		// a code review might have been created with the post, add it
		if (transforms.createdReview) {
			responseData.review = transforms.createdReview.getSanitizedObject({ request: this });
			// don't send these back, or broadcast
			delete responseData.review.reviewDiffs; 
			delete responseData.review.checkpointReviewDiffs;
		}

		// a code error might have been created with the post, add it
		if (transforms.createdCodeError) {
			responseData.codeError = transforms.createdCodeError.getSanitizedObject({ request: this });
		}

		// if there is a parent post update, add it
		if (transforms.postUpdate) {
			responseData.posts = [transforms.postUpdate];
		}
		if (transforms.grandParentPostUpdate) {
			responseData.posts = responseData.posts || [];
			responseData.posts.push(transforms.grandParentPostUpdate);
		}
		
		// if there are other codemarks updated, add them
		if (transforms.updatedCodemarks) {
			responseData.codemarks = transforms.updatedCodemarks;
		}
		
		// if there are other reviews updated, add them
		if (transforms.updatedReviews) {
			responseData.reviews = transforms.updatedReviews;
		}
		
		// if there are other code errors updated, add them
		if (transforms.updatedCodeErrors) {
			responseData.codeErrors = transforms.updatedCodeErrors;
		}
		
		// handle users invited to the team, filter out any users that were already on the team
		if (transforms.invitedUsers) {
			const newUsers = transforms.invitedUsers.filter(userData => !userData.wasOnTeam);
			responseData.users = [
				...newUsers.map(userData => userData.user.getSanitizedObject({ request: this }))
			];
		}
		await super.handleResponse();
	}

	// describe this route for help
	static describe (module) {
		const description = PostRequest.describe(module);
		description.description = 'Creates a post, along with associated codemark and markers. File streams and repos can also be created on-the-fly for the markers.';
		description.access = 'The current user must be a member of the stream.';
		description.input = {
			summary: description.input,
			looksLike: {
				'streamId*': '<ID of the stream in which the post is being created, required unless a stream object is specified>',
				'text': '<Text of the post>',
				'parentPostId': '<For replies, the ID of the parent post>',
				'codemark': '<Single @@#codemark#codemark@@ object, for creating a codemark referenced by the post>',
				'review': '<Single @@review@review@@ object, for creating a code review referenced by the post>',
				'codeError': '<Single @@code error@codeError@@ object, for creating a code error referenced by the post>',
				'mentionedUserIds': '<Array of IDs representing users mentioned in the post>',
				'reviewCheckpoint': '<Checkpoint number of the review this post is associated with>',
				'addedUsers': '<Array of emails representing non-team users being implicitly invited and mentioned>'
			}
		};
		description.returns.summary = 'A post object, plus additional objects that may have been created on-the-fly, marker objects and marker locations for any markers';
		Object.assign(description.returns.looksLike, {
			codemark: [
				'<@@#codemark object#codemark@@ > (knowledge base codemark referenced by this post)>',
				'...'
			],
			markers: [
				'<@@#marker objects#marker@@ > (marker objects associated with quoted markers)',
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
		description.errors.push('noReplyToReply');
		description.errors.push('noReplyWithReview');
		description.errors.push('noCodemarkAndReview');
		description.errors.push('noReplyWithCodeError');
		description.errors.push('noCodemarkAndCodeError');
		return description;
	}
}

module.exports = PostPostRequest;
