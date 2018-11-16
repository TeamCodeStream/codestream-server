// this class should be used to create all codemark documents in the database

'use strict';

const ModelCreator = require(process.env.CS_API_TOP + '/lib/util/restful/model_creator');
const Codemark = require('./codemark');
const MarkerCreator = require(process.env.CS_API_TOP + '/modules/markers/marker_creator');

class CodemarkCreator extends ModelCreator {

	get modelClass () {
		return Codemark;	// class to use to create an codemark model
	}

	get collectionName () {
		return 'codemarks';	// data collection to use
	}

	// convenience wrapper
	async createCodemark (attributes) {
		return await this.createModel(attributes);
	}

	// normalize post creation operation (pre-save)
	async normalize () {
		// if we have markers, preemptively make sure they are valid, 
		// we are strict about markers, and don't let them just get dropped if
		// they aren't correct
		if (this.attributes.markers) {
			await this.validateMarkers();
		}
	}

	// validate the markers sent with the post creation, this is too important to just drop,
	// so we return an error instead
	async validateMarkers () {
		const result = new Codemark().validator.validateArrayOfObjects(
			this.attributes.markers,
			{
				type: 'array(object)',
				maxLength: 10,
				maxObjectLength: 10000
			}
		);
		if (result) {	// really an error
			throw this.errorHandler.error('validation', { info: `markers: ${result}` });
		}
	}

	// these attributes are required or optional to create an codemark document
	getRequiredAndOptionalAttributes () {
		return {
			required: {
				string: ['teamId', 'type']
			},
			optional: {
				string: ['postId', 'streamId', 'providerType', 'status', 'color', 'title', 'text'],
				'array(object)': ['markers'],
				'array(string)': ['assignees']
			}
		};
	}

	// right before the document is saved...
	async preSave () {
		if (this.request.isForTesting()) { // special for-testing header for easy wiping of test data
			this.attributes._forTesting = true;
		}
		this.attributes.creatorId = this.request.user.id;
		this.createId();	 		// pre-allocate an ID
		await this.getTeam();		// get the team that will own this codemark
		await this.handleMarkers();	// handle any associated markers
		await this.validateAssignees();	// validate the assignees (for issues)
		await super.preSave();		// proceed with the save...
	}

	// get the team that will own this codemark
	async getTeam () {
		this.team = await this.data.teams.getById(this.attributes.teamId);
		if (!this.team) {
			throw this.errorHandler.error('notFound', { info: 'team'});
		}
		this.attributes.teamId = this.team.id;	
	}

	// handle any markers tied to the codemark
	async handleMarkers () {
		if (!this.attributes.markers) {
			return;
		}
		await Promise.all(this.attributes.markers.map(async marker => {
			await this.handleMarker(marker);
		}));
		this.attributes.markerIds = this.transforms.createdMarkers.map(marker => marker.id);
		this.attributes.fileStreamIds = this.transforms.createdMarkers.map(marker => (marker.get('fileStreamId') || null));
		delete this.attributes.markers;
	}

	// handle a single marker attached to the codemark
	async handleMarker (markerInfo) {
		// handle the marker itself separately
		Object.assign(markerInfo, {
			teamId: this.team.id
		});
		if (this.attributes.providerType) {
			markerInfo.providerType = this.attributes.providerType;
		}
		if (this.attributes.streamId) {
			markerInfo.postStreamId = this.attributes.streamId;
		}
		if (this.attributes.postId) {
			markerInfo.postId = this.attributes.postId;
		}
		const marker = await new MarkerCreator({
			request: this.request,
			codemarkId: this.attributes._id
		}).createMarker(markerInfo);
		this.transforms.createdMarkers = this.transforms.createdMarkers || [];
		this.transforms.createdMarkers.push(marker);
	}

	// if this is an issue, validate the assignees ... all users must be on the team
	async validateAssignees () {
		if (this.attributes.type !== 'issue') {
			// assignees only valid for issues
			delete this.attributes.assignees;
			return;
		}
		else if (this.attributes.providerType || !this.attributes.assignees) {
			// if using a third-party provider, we don't care what goes in there
			return;
		}

		const users = await this.data.users.getByIds(
			this.attributes.assignees,
			{
				fields: ['_id', 'teamIds'],
				noCache: true
			}
		);
		const teamId = this.team.id;
		if (
			users.length !== this.attributes.assignees.length ||
			users.find(user => !user.hasTeam(teamId))
		) {
			throw this.errorHandler.error('validation', { info: 'assignees must contain only users on the team' });
		}
	}
}

module.exports = CodemarkCreator;
