// handle the POST /posts request to create a new stream

'use strict';

const PostRequest = require(process.env.CS_API_TOP + '/lib/util/restful/post_request');
const StreamPublisher = require('./stream_publisher');

class PostStreamRequest extends PostRequest {

	// authorize the request for the current user
	async authorize () {
		// team ID must be provided, and the user must be a member of the team
		await this.user.authorizeFromTeamId(this.request.body, this, { error: 'createAuth' });
	}

	// after the post is created...
	async postProcess () {
		// publish the stream to the appropriate messager channel
		await new StreamPublisher({
			data: this.responseData,
			stream: this.responseData.stream,
			request: this,
			messager: this.api.services.messager,
			isNew: true
		}).publishStream();
	}

	// describe this route for help
	static describe (module) {
		const description = PostRequest.describe(module);
		description.description = 'Creates a stream of the given type. If the type is a channel, then an error is returned if there is already a channel stream with that name. If the type is direct, and a direct stream already exists with the same membership, that stream will be returned. If the type is file, and a file stream already exists with the same path, that stream will be returned.';
		description.access = 'Current user must be a member of the team in which the stream is being created.';
		description.input = {
			summary: description.input,
			looksLike: {
				'teamId*': '<ID of the team in which the stream is being created>',
				'type*': '<Type of the stream to be created: channel, direct, or file>',
				'isTeamStream': '<If true, the stream will be a \'team-stream\', meaning all members of the team are automatically members of the stream>',
				'repoId': '<For file streams, the repo that owns the file>',
				'file': '<For file streams, the path to the file relative to the repo, required if type is file>',
				'name': '<For channel streams, the name of the stream to be created, must not conflict with existing channel streams>',
				'privacy': '<For channel streams, public means other users can see the stream (even if they aren\'t members); direct streams are always private; file streams are always public>',
				'memberIds': '<For channel or direct streams, array of IDs representing the members of the stream>'
			}
		};
		description.returns.summary = 'The created stream object, or the found stream object if a matching stream was found';
		description.publishes = {
			summary: 'If the stream is public and was created (not found), the stream will be published to the team channel for the owning team. If the stream is private, and was created (not found), the stream will be published to the user channel for each user in the stream.',
			looksLike: {
				'stream': '<@@#stream object#stream@@>'
			}
		};
		description.errors = description.errors.concat([
			'invalidStreamType',
			'teamStreamMustBeChannel',
			'nameRequired',
			'invalidPrivacyType',
			'repoIdRequired',
			'fileRequired'
		]);
		return description;
	}

}

module.exports = PostStreamRequest;
