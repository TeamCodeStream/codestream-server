// handle the POST /codemarks request to create a new codemark (without a post)

'use strict';

const PostRequest = require(process.env.CS_API_TOP + '/lib/util/restful/post_request');
const { awaitParallel } = require(process.env.CS_API_TOP + '/server_utils/await_utils');
const StreamPublisher = require(process.env.CS_API_TOP + '/modules/streams/stream_publisher');

class PostCodemarkRequest extends PostRequest {

	// authorize the request for the current user
	async authorize () {
		this.teamId = this.request.body.teamId;
		if (!this.teamId) {
			throw this.errorHandler.error('parameterRequired', { info: 'teamId' });
		}
		this.teamId = this.teamId.toLowerCase();
		const authorized = await this.user.authorizeTeam(this.teamId, this);
		if (!authorized) {
			throw this.errorHandler.error('createAuth', { reason: 'user not on team' });
		}
	}

	async process () {
		// providerType is required for incoming requests, other attribute requirements
		// will be enforced by CodemarkCreator
		if (!this.request.body.providerType) {
			throw this.errorHandler.error('parameterRequired', { info: 'providerType' });
		}
		// if there is a postId, there must be a streamId
		if (this.request.body.postId && !this.request.body.streamId) {
			throw this.errorHandler.error('parameterRequired', { info: ' streamId with postId' });
		}
		await super.process();
	}

	/* eslint complexity: 0 */
	async handleResponse () {
		if (this.gotError) {
			return super.handleResponse();
		}

		// handle various data transforms that may have occurred as a result of creating the post,
		// adding objects to the response returned
		const { transforms, responseData } = this;

		// add any repos created for posts with codemarks and markers
		if (transforms.createdRepos && transforms.createdRepos.length > 0) {
			responseData.repos = transforms.createdRepos.map(repo => repo.getSanitizedObject());
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
			responseData.streams = transforms.createdStreamsForMarkers.map(stream => stream.getSanitizedObject());
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

		await super.handleResponse();
	}

	// after the response is sent
	async postProcess () {
		// these operations are independent and can happen in parallel
		await awaitParallel([
			this.publishCreatedStreamsForMarkers,	// publish any streams created on-the-fly for the markers, as needed
			this.publishRepos						// publish any created or updated repos to the team
		], this);
	}

	// if we created any streams on-the-fly for the markers, publish them as needed
	async publishCreatedStreamsForMarkers () {
		// streams created on-the-fly for markers are necessarily going to be file streams,
		// these should automatically get published to the whole team
		await Promise.all((this.transforms.createdStreamsForMarkers || []).map(async stream => {
			await this.publishStream(stream);
		}));
	}

	// publish any created or updated repos to the team
	async publishRepos () {
		const repos = (this.transforms.createdRepos || []).map(repo => repo.getSanitizedObject())
			.concat(this.transforms.repoUpdates || []);
		if (repos.length === 0) {
			return;
		}

		const channel = `team-${this.teamId}`;
		const message = {
			repos: repos,
			requestId: this.request.id
		};
		try {
			await this.api.services.messager.publish(
				message,
				channel,
				{ request: this }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.warn(`Could not publish repos message to team ${this.teamId}: ${JSON.stringify(error)}`);
		}
	}

	// publish a given stream
	async publishStream (stream) {
		const sanitizedStream = stream.getSanitizedObject();
		await new StreamPublisher({
			stream: sanitizedStream,
			data: { stream: sanitizedStream },
			request: this,
			messager: this.api.services.messager,
			isNew: true
		}).publishStream();
	}
	
	// describe this route for help
	static describe (module) {
		const description = PostRequest.describe(module);
		description.description = 'Creates an codemark, currently only for usage with third-party providers (eg. slack), otherwise codemarks must be created along with a post through POST /posts. For codemarks referencing code blocks, provide marker objects as a sub-object of the codemark.';
		description.access = 'Current user must be a member of the stream.';
		description.input = {
			summary: description.input,
			looksLike: {
				'teamId*': '<ID of the team for which the codemark is being created>',
				'providerType*': '<Third-party provider type (eg. slack)>',
				'type*': '<Type of this codemark (question, comment, etc.)>',
				'streamId': '<ID of the stream the codemark will belong to, assumed to be reference to a third-party stream or conversation>',
				'postId': '<ID of the post the codemark will be associated with, assumed to be a reference to a third-party post>',
				'color': '<Display color of the codemark>',
				'status': '<Status of the codemark, for things like issues>',
				'title': '<Title of the codemark>',
				'assignees': '<Array of IDs representing users assigned to the codemark, for issues>',
				'markers': '<Array of @@#marker objects#marker@@ representing markers to be created for this codemark>'
			}
		};
		description.returns.summary = 'An codemark object, plus any markers created, plus streams and/or repos created for markers';
		Object.assign(description.returns.looksLike, {
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
			],
		});
		return description;
	}
}

module.exports = PostCodemarkRequest;
