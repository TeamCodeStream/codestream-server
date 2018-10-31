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
		if (transforms.createdStreamsForMarkers && transforms.createdStreamsForMarkers.length > 0) {
			responseData.streams = transforms.createdStreamsForMarkers.map(stream => stream.getSanitizedObject());
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

	// describe this route for help
	static describe (module) {
		const description = PostRequest.describe(module);
		description.description = 'Creates an item, currently only for usage with third-party providers (eg. slack), otherwise items must be created along with a post through POST /posts';
		description.access = 'Current user must be a member of the stream.';
		description.input = {
			summary: description.input,
			looksLike: {
				'teamId*': '<ID of the team for which the item is being created>',
				'providerType*': '<Third-party provider type (eg. slack)>',
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
		return description;
	}
}

module.exports = PostItemRequest;
