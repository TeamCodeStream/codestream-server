// handle the POST /markers request to create a new marker (without a post)

'use strict';

const PostRequest = require(process.env.CS_API_TOP + '/lib/util/restful/post_request');
const CodeBlockHandler = require(process.env.CS_API_TOP + '/modules/posts/code_block_handler');
const MarkerCreator = require('./marker_creator');

class PostMarkerRequest extends PostRequest {

	// authorize the request for the current user
	async authorize () {
		let teamId = this.request.body.teamId;
		if (!teamId) {
			throw this.errorHandler.error('parameterRequired', { info: 'teamId' });
		}
		teamId = teamId.toLowerCase();
		const authorized = await this.user.authorizeTeam(teamId, this);
		if (!authorized) {
			throw this.errorHandler.error('createAuth', { reason: 'user not on team' });
		}

		if (!this.request.body.streamId) {
			return;
		}
		const streamId = this.request.body.streamId.toLowerCase();
		this.stream = await this.data.streams.getById(streamId);
		if (!this.stream) {
			throw this.errorHandler.error('notFound', { info: 'stream' });
		}
		if (this.stream.get('teamId') !== teamId) {
			throw this.errorHandler.error('createAuth', { reason: 'stream does not belong to team' });
		}
		if (this.stream.get('type') !== 'file') {
			throw this.errorHandler.error('createAuth', { reason: 'stream must be a file type stream' });
		}
	}

	// process the request
	async process () {
		await this.requireAndAllow();		// require certain parameters, discard unknown parameters
		await this.getTeam();
		await this.createMarker();
	}

	// require certain parameters, discard unknown parameters
	async requireAndAllow () {
		// the location coordinates must be valid, we don't just discard location attributes that are
		// not of the correct type
		if (typeof this.request.body.location !== 'undefined') {
			const result = MarkerCreator.validateLocation(this.request.body.location);
			if (result) {
				throw this.errorHandler.error('validation', { info: 'invalid location: ' + result });
			}
		}

		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['teamId', 'providerType', 'postStreamId', 'postId', 'code']
				},
				optional: {
					string: ['streamId', 'file', 'repoId', 'commitHash', 'preContext', 'postContext', 'type', 'color', 'status'],	
					array: ['location'],
					'array(string)': ['remotes']
				}
			}
		);
	}

	async getTeam () {
		const teamId = this.request.body.teamId.toLowerCase();
		this.team = await this.data.teams.getById(teamId);
		if (!this.team) {
			this.errorHandler.error('notFound', { info: 'team' });
		}
	}

	async createMarker () {
		const codeBlockAttributes = {
			code: this.request.body.code
		};
		['streamId', 'commitHash', 'repoId'].forEach(attribute => {
			if (this.request.body[attribute]) {
				codeBlockAttributes[attribute] = this.request.body[attribute].toLowerCase();
			}
		});
		['location', 'file', 'preContext', 'postContext', 'remotes'].forEach(attribute => {
			if (this.request.body[attribute]) {
				codeBlockAttributes[attribute] = this.request.body[attribute];
			}
		});

		const additionalAttributes = {};
		['type', 'status', 'color'].forEach(attribute => {
			if (this.request.body[attribute]) {
				additionalAttributes[attribute] = this.request.body[attribute];
			}
		});

		const codeBlockInfo = await new CodeBlockHandler({
			codeBlock: codeBlockAttributes,
			request: this,
			team: this.team,
			postStreamId: this.request.body.postStreamId,
			postId: this.request.body.postId,
			postAttributes: additionalAttributes
		}).handleCodeBlock();

		// as a "side effect", this may have created any number of things, like a new repo, new stream, etc.
		// we'll track these things and attach them to the request response later, and also possibly publish
		// them on pubnub channels
		if (codeBlockInfo.createdRepo) {
			this.responseData.repo = codeBlockInfo.createdRepo.getSanitizedObject();
		}
		else if (codeBlockInfo.repoUpdate) {
			this.responseData.repo = codeBlockInfo.repoUpdate;
		}
		if (codeBlockInfo.createdStream) {
			this.responseData.stream = codeBlockInfo.createdStream.getSanitizedObject();
		}
		if (codeBlockInfo.createdMarker) {
			this.responseData.marker = codeBlockInfo.createdMarker.getSanitizedObject();
		}
		if (codeBlockInfo.markerLocation) {
			this.responseData.markerLocations = [codeBlockInfo.markerLocation];
		}
	}

	async postProcess () {
		await this.publishToTeam();		
	}

	async publishToTeam () {
		const channel = `team-${this.team.id}`;
		const message = Object.assign(
			{
				requestId: this.request.id
			},
			this.responseData
		);
		try {
			await this.api.services.messager.publish(
				message,
				channel,
				{ request: this.request }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.request.warn(`Could not publish marker creation message to team ${this.team.id}: ${JSON.stringify(error)}`);
		}
	}

	// describe this route for help
	static describe (module) {
		const description = PostRequest.describe(module);
		description.description = 'Creates a marker, currently only for usage with third-party providers (eg. slack), otherwise markers must be created along with a post through POST /posts';
		description.access = 'Current user must be a member of the team for which the marker is being created.';
		description.input = {
			summary: description.input,
			looksLike: {
				'teamId*': '<ID of the team for which the marker is being created>',
				'providerType*': '<Third-party provider type (eg. slack)>',
				'postStreamId*': '<ID of the third-party stream the post the marker is associated with belongs to, assumed to be reference to a third-party stream or conversation>',
				'postId*': '<ID of the post the marker is associated with, assumed to be a reference to a third-party post>',
				'streamId': '<ID of the file stream the marker references>',
				'file': '<Path to the file the marker is associated with, if no streamId is available>',
				'repoId': '<ID of the repo to which the file the marker is associated with belongs>',
				'remotes': '<Array of remotes representing the repo to which the file the marker is associated with belongs, if no repoId is available>',
				'commitHash': '<The commit hash representing the commit the file was on when the marker was created>',
				'code*': '<The associated code>',
				'preContext': '<Code to display before the code of interest (deprecated?)>',
				'postContext': '<Code to display after the code of interest (deprecated?)>',
				'location': '<Location coordinates (startLine, endLine, startColumn, endColumn) for the marker>',
				'type': '<Assign a type to this marker ("question", "comment", etc.)>',
				'color': '<Display color of the marker>',
				'status': '<Status of the marker, for things like tasks>'
			}
		};
		description.returns.summary = 'A marker object, plus a stream object if a stream was created on-the-fly, marker objects and marker locations for any code blocks';
		Object.assign(description.returns.looksLike, {
			marker: '<@@#marker object#marker@@ > (marker object created)',
			stream: '<@@#stream object#stream@@ > (if a file stream created on-the fly for the marker)>',
			markerLocations: '<@@#marker locations object#markerLocations@@ > (marker location associated with the marker object created)'
		});
		description.publishes = {
			summary: 'Marker object and other associated objects (a message identical to the request response) will be be published to the team channel.',
			looksLike: {
				marker: '<@@#marker object#marker@@ > (marker object created)',
				stream: '<@@#stream object#stream@@ > (if a file stream created on-the fly for the marker)>',
				markerLocations: '<@@#marker locations object#markerLocations@@ > (marker location associated with the marker object created)'
			}
		};
		return description;
	}
}

module.exports = PostMarkerRequest;
