// handle the POST /posts request to create a new post

'use strict';

const PostRequest = require(process.env.CS_API_TOP + '/lib/util/restful/post_request');
const PostAuthorizer = require('./post_authorizer');

class PostPostRequest extends PostRequest {

	// authorize the request for the current user
	async authorize () {
		await new PostAuthorizer({
			user: this.user,
			post: this.request.body,
			request: this,
			errorHandler: this.errorHandler
		}).authorizePost();
	}

	// describe this route for help
	static describe (module) {
		const description = PostRequest.describe(module);
		description.description = 'Creates a post, along with markers for associated code blocks. Streams can also be created on-the-fly, either for the post, or for any code blocks it quotes.';
		description.access = 'For posts in a file stream, the current user must be a member of the team to which the file stream belongs. For posts in a channel stream or a direct stream, the current user must be a member of the stream.';
		description.input = {
			summary: description.input,
			looksLike: {
				'streamId': '<ID of the stream in which the post is being created, required unless a stream object is specified>',
				'text': '<Text of the post>',
				'commitHashWhenPosted': '<For file streams, if code blocks are given, the commit hash the file is on>',
				'parentPostId': '<For replies, the ID of the parent post>',
				'codeBlocks': '<Array of code blocks, specifying code quoted by this post>',
				'mentionedUserIds': '<Array of IDs representing users mentioned in the post>',
				'stream': '<Minimal attributes of a @@#stream object#stream@@, for creating a stream for the post on-the-fly, required if no streamId is given>',
				'providerType': '<For third-party integrations, type of provider (slack, msteams, etc.) the post is associated with>',
				'providerPostId': '<For third-party integrations, ID of the post that this post references in the third-party integration provider>',
				'providerConversationId': '<For third-party integrations, ID of the conversation (team, group, DM) to which this post belongs in the the third-party integration provider>',
				'providerInfo': '<For third-party integrations, free-form object for additional info relevant to the third-party post>',
				'type': '<Assign a type to this post ("question", "comment", etc.)>',
				'color': '<Display color of the post>',
				'status': '<Status of the post, for things like tasks>',
				'title': '<Title of the post>',
				'assignees': '<Array of IDs representing users assigned to the post, for tasks>'
			}
		};
		description.returns.summary = 'A post object, plus a stream object if a stream was created on-the-fly, marker objects and marker locations for any code blocks';
		Object.assign(description.returns.looksLike, {
			stream: '<@@#stream object#stream@@ > (if stream created on-the fly for the post)>',
			streams: [
				'<@@#stream object#stream@@ > (additional streams created on-the-fly for code blocks)>',
				'...'
			],
			markers: [
				'<@@#marker object#marker@@ > (marker objects associated with quoted code blocks)',
				'...'
			],
			markerLocations: '<@@#marker locations object#markerLocations@@ > (marker locations for markers associated with quoted code blocks)'
		});
		description.publishes = {
			summary: 'If the post was created in a file stream or a team stream (a channel with all members of the team), then the post object will be published to the team channel; otherwise it will be published to the stream channel for the stream in which it was created.',
			looksLike: {
				post: '<@@#post object#post@@>',
				stream: '<@@#stream object#stream@@ > (if stream created on-the fly for the post)>',
				streams: [
					'<@@#stream object#stream@@ > (additional streams created on-the-fly for code blocks)>',
					'...'
				],
				markers: [
					'<@@#marker object#marker@@ > (marker objects associated with quoted code blocks)',
					'...'
				],
				markerLocations: '<@@#marker locations object#markerLocations@@ > (marker locations for markers associated with quoted code blocks)'
			}
		};
		return description;
	}
}

module.exports = PostPostRequest;
