// handle the POST /items request to create a new item (without a post)

'use strict';

const PostRequest = require(process.env.CS_API_TOP + '/lib/util/restful/post_request');

class PostItemRequest extends PostRequest {

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
	}

	async process () {
		// providerType is required for incoming requests, other attribute requirements
		// will be enforced by ItemCreator
		if (!this.request.body.providerType) {
			throw this.errorHandler.error('parameterRequired', { info: 'providerType' });
		}
		await super.process();
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
		if (transforms.createdStreamsForCodeBlocks && transforms.createdStreamsForCodeBlocks.length > 0) {
			responseData.streams = transforms.createdStreamsForCodeBlocks.map(stream => stream.getSanitizedObject());
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
		await super.handleResponse();
	}


	async postProcess () {
		// if any markers were created, then we need to publish those to the team
		if (this.responseData.markers && this.responseData.markers.length > 0) {
			await this.publishToTeam();
		}
	}

	async publishToTeam () {
		const channel = `team-${this.team.id}`;
		const message = Object.assign(
			{
				requestId: this.request.id
			},
			this.responseData
		);
		delete message.item;	// don't publish the item itself, this is private to the conversation
		try {
			await this.api.services.messager.publish(
				message,
				channel,
				{ request: this.request }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.request.warn(`Could not publish item creation message to team ${this.team.id}: ${JSON.stringify(error)}`);
		}
	}

	// describe this route for help
	static describe (module) {
		const description = PostRequest.describe(module);
		description.description = 'Creates an item, currently only for usage with third-party providers (eg. slack), otherwise items must be created along with a post through POST /posts';
		description.access = 'Current user must be a member of the stream.';
		description.input = {
			summary: description.input,
			looksLike: {
				'teamId*': '<ID of the team for which the item is being created>',
				'providerType': '<Third-party provider type (eg. slack)>',
				'streamId': '<ID of the stream the item will belong to, assumed to be reference to a third-party stream or conversation>',
				'postId': '<ID of the post the item will be associated with, assumed to be a reference to a third-party post>',
				'type*': '<Type of this item ("question", "comment", etc.)>',
				'color': '<Display color of the item>',
				'status': '<Status of the item, for things like issues>',
				'title': '<Title of the item>',
				'assignees': '<Array of IDs representing users assigned to the item, for issues>'
			}
		};
		description.returns.summary = 'An item object';
		Object.assign(description.returns.looksLike, {
			item: '<@@#item object#item@@ > (item object created)'
		});
		description.publishes = {
			summary: 'Item object will be be published to the team channel if created in a team-stream.',
			looksLike: {
				marker: '<@@#marker object#marker@@ > (marker object created)',
				stream: '<@@#stream object#stream@@ > (if a file stream created on-the fly for the marker)>',
				markerLocations: '<@@#marker locations object#markerLocations@@ > (marker location associated with the marker object created)'
			}
		};
		return description;
	}
}

module.exports = PostItemRequest;
