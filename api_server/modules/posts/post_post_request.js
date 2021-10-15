// handle the POST /posts request to create a new post

'use strict';

const PostRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/post_request');

class PostPostRequest extends PostRequest {

	// authorize the request for the current user
	async authorize () {
		let teamId = this.request.body.teamId;
		if (!teamId) {
			throw this.errorHandler.error('parameterRequired', { info: 'teamId' });
		}
		teamId = teamId.toLowerCase();
		if (!this.user.authorizeTeam(teamId)) {
			throw this.errorHandler.error('createAtuh', { reason: 'user is not a member of the team' });
		}

		let streamId = this.request.body.streamId;
		if (!streamId) {
			// this is acceptable ONLY if we are creating a code error
			if (!this.request.body.codeError) {
				throw this.errorHandler.error('parameterRequired', { info: 'streamId' });
			} else {
				return;
			}
		}
		streamId = streamId.toLowerCase();
		
		// for replies, the stream ID always comes from the parent, ignore otherwise
		const parentPostId = this.request.body.parentPostId;
		if (parentPostId) {
			const parentPost = await this.data.posts.getById(parentPostId.toLowerCase());
			if (!parentPost) {
				throw this.errorHandler.error('notFound', { info: 'parentPost' });
			}
			streamId = this.request.body.streamId = parentPost.get('streamId');
		}

		const stream = await this.user.authorizeStream(streamId, this);
		if (!stream) {
			throw this.errorHandler.error('createAuth');
		}

		if (!stream.get('isTeamStream') && stream.get('type') !== 'object') {
			throw 'stream channels are deprecated';
		}

		/*
		if (stream.get('type') === 'object' && this.request.body.codemark) {
			// when creating a codemark to go with a reply to an object, we MUST have a team ID
			// since there is no other way to make an associated to repos ... an admitted weirdness
			if (!this.request.body.teamId) {
				return this.errorHandler.error('parameterRequired', { info: 'teamId', reason: 'team ID is required when replying to a code error with a codemark' });
			}
		}
		*/
	}

	/* eslint complexity: 0 */
	async handleResponse () {
		if (this.gotError) {
			return super.handleResponse();
		}

		this.responseData = this.creator.makeResponseData({
			transforms: this.transforms,
			initialResponseData: this.responseData
		});
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
