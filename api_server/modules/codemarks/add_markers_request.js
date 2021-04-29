// handle the PUT /codemarks/:id/add-markers request to add one or more markers to a codemark

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');
const Codemark = require('./codemark');
const MarkerCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/markers/marker_creator');
const CodemarkAttributes = require('./codemark_attributes');
const RepoMatcher = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/repos/repo_matcher');
const RepoIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/repos/indexes');

class AddMarkersRequest extends RestfulRequest {

	// authorize the request for the current user
	async authorize() {
		// only the codemark's creator, or an admin, can add a marker
		const codemarkId = this.request.params.id.toLowerCase();
		this.codemark = await this.data.codemarks.getById(codemarkId);
		if (!this.codemark) {
			throw this.errorHandler.error('notFound', { info: 'codemark' });
		}
		if (!this.user.hasTeam(this.codemark.get('teamId'))) {
			throw this.errorHandler.error('updateAuth', { reason: 'user must be a member of the team' });
		}
		if (this.user.id === this.codemark.get('creatorId')) {
			return;
		}
		this.team = await this.data.teams.getById(this.codemark.get('teamId'));
		if (!(this.team.get('adminIds') || []).includes(this.user.id)) {
			throw this.errorHandler.error('updateAuth', { reason: 'only the codemark creator or an admin can add a marker' });
		}
	}

	// process the request...
	async process() {
		await this.requireAndAllow();	// require parameters, and filter out unknown parameters
		await this.validateMarkers();	// validate the markers to be added
		await this.getTeam();			// get the team that owns the codemark
		await this.getRepos();			// get the team's repos
		await this.addMarkers();		// add the markers
		await this.updateCodemark();	// update the codemark 
	}

	// require certain parameters, and discard unknown parameters
	async requireAndAllow() {
		await this.requireAllowParameters(
			'body',
			{
				required: {
					'array(object)': ['markers']
				},
				optional: {
					'number': ['at']
				}
			}
		);
	}

	// validate the markers sent, this is too important to just drop,
	// so we return an error instead
	async validateMarkers() {
		const { markers } = this.request.body;
		if (markers.length === 0) {
			throw this.errorHandler.error('validation', { info: 'markers: at least one marker must be specified' });
		}
		const result = new Codemark().validator.validateArrayOfObjects(
			markers,
			{
				type: 'array(object)',
				maxLength: CodemarkAttributes.markerIds.maxLength,
				maxObjectLength: 1000000
			}
		);
		if (result) {	// really an error
			throw this.errorHandler.error('validation', { info: `markers: ${result}` });
		}
	}


	// get the team that owns the codemark
	async getTeam() {
		this.team = await this.data.teams.getById(this.codemark.get('teamId'));
		if (!this.team) {
			return this.errorHandler.error('notFound', { info: 'team' });	// shouldn't really happen
		}
	}

	// we'll need all the repos for the team if there are markers, and we'll use a "RepoMatcher" 
	// to match the marker attributes to a repo if needed
	async getRepos() {
		this.teamRepos = await this.data.repos.getByQuery(
			{
				teamId: this.team.id
			},
			{
				hint: RepoIndexes.byTeamId
			}
		);
		this.repoMatcher = new RepoMatcher({
			request: this,
			team: this.team,
			teamRepos: this.teamRepos
		});
	}	

	// add the markers at the position indicated by "at", or append
	async addMarkers() {
		for (let marker of this.request.body.markers) {
			await this.addMarker(marker);
		}
	}

	// add a single marker to the codemark
	async addMarker(markerInfo) {
		// handle the marker itself separately
		Object.assign(markerInfo, {
			teamId: this.team.id
		});
		if (this.codemark.get('providerType')) {
			markerInfo.providerType = this.codemark.get('providerType');
		}
		if (this.codemark.get('streamId')) {
			markerInfo.postStreamId = this.codemark.get('streamId');
		}
		if (this.codemark.get('postId')) {
			markerInfo.postId = this.codemark.get('postId');
		}
		const marker = await new MarkerCreator({
			request: this,
			codemarkId: this.codemark.id,
			repoMatcher: this.repoMatcher,
			teamRepos: this.teamRepos
		}).createMarker(markerInfo);
		this.transforms.createdMarkers = this.transforms.createdMarkers || [];
		this.transforms.createdMarkers.push(marker);
	}

	// update the codemark with the new markers
	async updateCodemark() {
		const markerIds = this.codemark.get('markerIds') || [];
		const fileStreamIds = this.codemark.get('fileStreamIds') || [];
		let at = this.request.body.at;
		if (at === undefined) {
			at = markerIds.length;
		} else if (at < 0) {
			at = 0;
		} else if (at > markerIds.length) {
			at = markerIds.length;
		}

		const addedMarkerIds = this.transforms.createdMarkers.map(marker => marker.id);
		const newMarkerIds = [
			...markerIds.slice(0, at),
			...addedMarkerIds,
			...markerIds.slice(at)
		];

		const addedFileStreamIds = this.transforms.createdMarkers.map(marker => marker.get('fileStreamId'));
		const newFileStreamIds = [
			...fileStreamIds.slice(0, at),
			...addedFileStreamIds,
			...fileStreamIds.slice(at)
		];

		const op = {
			$set: {
				markerIds: newMarkerIds,
				fileStreamIds: newFileStreamIds,
				modifiedAt: Date.now()
			}
		};
		this.updateOp = await new ModelSaver({
			request: this,
			collection: this.data.codemarks,
			id: this.codemark.id
		}).save(op);
	}

	async handleResponse() {
		if (this.gotError) {
			return await super.handleResponse();
		}
		this.responseData = {
			codemark: this.updateOp,
			markers: this.transforms.createdMarkers.map(marker => marker.getSanitizedObject())
		};

		const { transforms, responseData } = this;

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

		// markers with locations will have a separate markerLocations object
		if (transforms.markerLocations && transforms.markerLocations.length > 0) {
			responseData.markerLocations = transforms.markerLocations;
		}

		await super.handleResponse();
	}

	// after the codemarks are related...
	async postProcess() {
		// send message to the team channel
		const channel = 'team-' + this.codemark.get('teamId');
		const message = Object.assign({}, this.responseData, { requestId: this.request.id });
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate
			this.warn(`Unable to publish codemark add-marker message to channel ${channel}: ${JSON.stringify(error)}`);
		}
	}

	// describe this route for help
	static describe() {
		return {
			tag: 'add-markers',
			summary: 'Add one or more markers to a codemark',
			access: 'User must be the creator of the codemark, or an admin on the team that owns the codemark.',
			description: 'Add one or more markers (code blocks) to a codemark. The markers will be added to the position indicated by the "at" attribute in the request, or will be pushed to the end of the array of markers.',
			input: {
				summary: 'Specify the codemark ID in the request path, the marker attributes in the "markers" array, and optional "at" to specify a position to add the markers.',
				looksLike: {
					'markers*': '<Array of marker attributes>',
					'at': '<Position to add the markers at, will be appended if no specified>'
				}
			},
			returns: {
				summary: 'A codemark, with directives indicating how to update the codemark',
				looksLike: {
					codemark: '<some directive>',
					markers: '<array of markers added>'
				}
			},
			publishes: 'The response data will be published on the team channel for the team that owns the codemark',
			errors: [
				'updateAuth',
				'notFound',
				'validation'
			]
		};
	}
}

module.exports = AddMarkersRequest;
