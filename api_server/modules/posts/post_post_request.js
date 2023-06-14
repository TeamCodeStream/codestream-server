// handle the POST /posts request to create a new post

'use strict';

const GrokClient = require("../../lib/grok/grok_client");
const PostRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/post_request');

class PostPostRequest extends PostRequest {

	// authorize the request for the current user
	async authorize () {
		const streamId = this.request.body.streamId;
		if (!streamId) {
			throw this.errorHandler.error('parameterRequired', { info: 'streamId' });
		}
		const stream = await this.user.authorizeStream(streamId.toLowerCase(), this);
		if (!stream) {
			throw this.errorHandler.error('createAuth');
		}
		if (!stream.get('isTeamStream') && stream.get('type') !== 'object') {
			throw this.errorHandler.error('deprecated', { reason: 'posts can only be created in the team stream or an object stream' });
		}
		if (this.request.body.teamId && this.request.body.teamId !== stream.get('teamId')) {
			throw this.errorHandler.error('invalidParameter', { reason: 'teamId does not match the stream' });
		}
		this.request.body.teamId = stream.get('teamId');

		// WARNING: If you pass this flag, your post will NOT be saved!
		//
		// We have a scenario with Grok where we need to POST a new post and have it
		// completely reinitialize the Grok conversation, but we want to throw away
		// the actual post that is coming in. Certain methods will be completely skipped!
		this.reinitializeGrok = (this.request.body.reinitialize && this.request.body.reinitialize === true) || false;
	}

	async process(){
		if(this.reinitializeGrok){
			return;
		}

		await super.process();
	}

	/* eslint complexity: 0 */
	async handleResponse () {
		if (this.gotError) {
			return super.handleResponse();
		}

		if(this.reinitializeGrok){
			if(!this.request.body.parentPostId){
				throw this.errorHandler.error('parameterRequired', { reason: 'parentPostId is required for Grok reinitialization' });
			}
			// Need to return the parent post so that the client has one to work with.
			this.responseData.post = await this.data.posts.getById(this.request.body.parentPostId);
			return super.handleResponse();
		}

		this.responseData = this.creator.makeResponseData({
			transforms: this.transforms,
			initialResponseData: this.responseData
		});

		await super.handleResponse();
	}

	async postProcess () {
		if(!this.reinitializeGrok){
			await super.postProcess();
		}

		if(!!this.request.body.analyze || 
			this.request.body.text.match(/\@Grok/gmi) || 
			this.reinitializeGrok){
	 		
			return new GrokClient().analyzeErrorWithGrok(
				{
					postRequest: this
				}
			);
		}
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
				'addedUsers': '<Array of emails representing non-team users being implicitly invited and mentioned>',
				'analyze':'<Boolean to indicate whether to have Grok analyze the codeError>',
				'codeBlock':'<String representing a code block associated with an error >'
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
