// handler for the "PUT /calculate-locations" request, to calculate marker locations
// as they have changed from a given commit to a different commit

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
const MarkerMapper = require('./marker_mapper');
const MarkerCreator = require(process.env.CS_API_TOP + '/modules/markers/marker_creator');

class CalculateMarkerLocationsRequest extends RestfulRequest {

	// authorize the request
	async authorize () {
		// must have access to the team the stream belongs to
		await this.user.authorizeFromTeamId(
			this.request.body,
			this,
			{ error: 'updateAuth' }
		);
		this.teamId = this.request.body.teamId.toLowerCase();
	}

	// process the request...
	async process () {
		await this.require();					// check for required parameters
		await this.validate();					// validate input parameters
		await this.getOriginalCommitMarkers();	// get marker locations associated with the original commit
		await this.getStream();					// get the stream as needed
		await this.calculateNewCommitMarkers(); // calculate new marker locations
		await this.prepareForUpdate();			// prepare the newly calculated marker locations for update
		await this.updateLocations();			// save marker locations,
	}

	// these parameters are required for the request
	async require () {
		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['teamId' ],
					'array(object)': ['edits']
				},
				optional: {
					'object': ['locations'],
					'string': ['streamId', 'originalCommitHash', 'newCommitHash']
				}
			}
		);
	}

	// validate the request's input parameters
	async validate () {
		if (this.request.body.streamId) {
			this.streamId = this.request.body.streamId.toLowerCase();
		}
		if (!this.streamId) {
			delete this.request.body.newCommitHash;	// newCommitHash is irrelevant if no stream ID is provided
		}
		if (this.request.body.originalCommitHash) {
			this.originalCommitHash = this.request.body.originalCommitHash.toLowerCase();
		}
		if (this.request.body.newCommitHash) {
			this.newCommitHash = this.request.body.newCommitHash.toLowerCase();
		}
		await this.validateEdits();
		await this.validateLocations();
	}

	// validate the edits array
	async validateEdits () {
		for (let i = 0, length = this.request.body.edits.length; i < length; i++) {
			const edit = this.request.body.edits[i];
			const error = this.validateEdit(edit);
			if (error) {
				throw this.errorHandler.error('invalidParameter', { info: `edits (#${i}): ${error}` });
			}
		}
	}

	// validate a single edit Object
	validateEdit (edit) {
		const numerics = ['delStart', 'delLength', 'addStart', 'addLength'];
		for (let i = 0, length = numerics.length; i < length; i++) {
			if (typeof edit[numerics[i]] !== 'number') {
				return `edit.${numerics[i]} is not a number`;
			}
		}
		return this.validateArrayOfStrings(edit.adds || [], 'adds') ||
			this.validateArrayOfStrings(edit.dels || [], 'dels');
	}

	// validate that the passed array is an array of strictly strings
	validateArrayOfStrings (array, which) {
		if (!(array instanceof Array)) {
			return `edits.${which} is not an array`;
		}
		for (let i = 0, length = array.length; i < length; i++) {
			if (typeof array[i] !== 'string') {
				return `edits.${which} contains non-string`;
			}
		}
	}

	// validate the input locations
	async validateLocations () {
		if (!this.request.body.locations) {
			// no locations provided, we'll fetch them from the database and calculate
			// for all of them
			return;
		}
		const markerIds = Object.keys(this.request.body.locations);
		for (let i = 0, length = markerIds; i < length; i++) {
			const markerId = markerIds[i];
			// validate the marker ID
			if (!this.objectIdSafe(markerId)) {
				throw this.errorHandler.error('validation', { info: `${markerId} is not a valid marker ID` });
			}
			// validate the location array, which must conform to a strict format
			const location = this.request.body.locations[markerId];
			const result = MarkerCreator.validateLocation(location);
			if (result) {
				throw this.errorHandler.error('validation', { info: `not a valid location for marker ${markerId}: ${result}` });
			}
		}
	}

	// get any markers associated with the original commit, if any
	async getOriginalCommitMarkers () {
		if (this.request.body.locations) {
			// the client provided some locations to calculate for, so no need
			// to fetch from the database
			return;
		}
		else if (!this.streamId || !this.originalCommitHash) {
			throw this.errorHandler.error('parameterRequired', { info: 'locations, or streamId and originalCommitHash' });
		}
		const id = `${this.streamId}|${this.originalCommitHash}`;
		const markerLocations = await this.data.markerLocations.getByQuery(
			{ _id: id },
			{
				databaseOptions: {
					hint: { _id: 1 }
				}
			}
		);
		this.originalMarkerLocations = (markerLocations && markerLocations[0]) || {};
	}

	// get the stream, as needed
	async getStream () {
		if (!this.streamId) {
			return;	// client does not need to provide a stream, but we won't be saving anything
		}
		this.stream = await this.data.streams.getById(this.streamId);
		if (!this.stream) {
			throw this.errorHandler.error('notFound', { info: 'stream' });
		}
		if (this.stream.get('type') !== 'file') {
			throw this.errorHandler.error('updateAuth', { reason: 'must be file stream' });
		}
		if (this.stream.get('teamId') !== this.teamId) {
			throw this.errorHandler.error('updateAuth', { reason: 'stream must be from team' });
		}
	}

	// calculate the locations of any markers we can given the input data
	async calculateNewCommitMarkers () {
		// either the client provided us with locations, or we got them from the database
		const locations = this.request.body.locations || this.originalMarkerLocations.get('locations');
		// now calculate new marker locations given the edits passed in
		const markerMapper = new MarkerMapper(
			locations,
			this.request.body.edits
		);
		this.calculatedMarkerLocations = await markerMapper.getUpdatedMarkerData();
	}

	// prepare the newly calculate marker locations for update
	async prepareForUpdate () {
		this.update = {};
		this.publish = {};
		if (this.newCommitHash) {
			// client can request to calculate without saving, indicated by no newCommitHash or no stream ID
			Object.keys(this.calculatedMarkerLocations).forEach(markerId => {
				let location = this.calculatedMarkerLocations[markerId];
				this.update[`locations.${markerId}`] = location;	// for database update
				this.publish[markerId] = location;					// for publishing
			});
		}
		let markerLocations = {
			teamId: this.teamId,
			streamId: this.streamId, // note - this can be undefined and that's ok
			locations: this.calculatedMarkerLocations
		};
		if (this.newCommitHash) {
			markerLocations.commitHash = this.newCommitHash;
		}
		Object.assign(this.responseData, { markerLocations });
	}

	// update marker locations for the new commit
	async updateLocations () {
		if (!this.newCommitHash) {
			return;	// client can request not to save, indicated by no newCommitHash
		}
		const id = `${this.streamId}|${this.newCommitHash}`;
		let update = {
			$set: this.update
		};
		update.$set.teamId = this.teamId;
		if (this.isForTesting()) { // special for-testing header for easy wiping of test data
			update.$set._forTesting = true;
		}
		await this.data.markerLocations.applyOpById(
			id,
			update,
			{
				databaseOptions: {
					upsert: true
				}
			}
		);
	}

	// after processing the request...
	async postProcess () {
		if (!this.newCommitHash) {
			// we assume that if the client doesn't want them saved (indicated by no newCommitHash), they don't want them published
			return;
		}
		// publish the marker locations update to users in the team
		await this.publishMarkerLocations();
	}

	// publish the marker locations update to users in the team
	async publishMarkerLocations () {
		const channel = 'team-' + this.teamId;
		const message = {
			markerLocations: {
				teamId: this.teamId,
				streamId: this.streamId,
				commitHash: this.newCommitHash,
				locations: this.publish
			},
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
			this.warn(`Could not publish marker location calculations update to team ${this.teamId}: ${JSON.stringify(error)}`);
		}
	}
}

module.exports = CalculateMarkerLocationsRequest;
