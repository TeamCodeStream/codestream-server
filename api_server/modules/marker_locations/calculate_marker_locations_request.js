// handler for the "PUT /calculate-locations" request, to calculate marker locations
// as they have changed from a given commit to a different commit

'use strict';

var RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var MarkerMapper = require('./marker_mapper');
var MarkerCreator = require(process.env.CS_API_TOP + '/modules/markers/marker_creator');

class CalculateMarkerLocationsRequest extends RestfulRequest {

	// authorize the request
	authorize (callback) {
		// must have access to the team the stream belongs to
		this.user.authorizeFromTeamId(
			this.request.body,
			this,
			error => {
				if (error) { return callback(error); }
				this.teamId = this.request.body.teamId.toLowerCase();
				process.nextTick(callback);
			},
			{
				error: 'updateAuth'
			}
		);
	}

	// process the request...
	process (callback) {
		BoundAsync.series(this, [
			this.require,					// check for required parameters
			this.validate,					// validate input parameters
			this.getOriginalCommitMarkers,	// get marker locations associated with the original commit
			this.getStream,					// get the stream as needed
			this.calculateNewCommitMarkers, // calculate new marker locations
			this.prepareForUpdate,			// prepare the newly calculated marker locations for update
			this.update						// save marker locations,
		], callback);
	}

	// these parameters are required for the request
	require (callback) {
		this.requireAllowParameters(
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
			},
			callback
		);
	}

	// validate the request's input parameters
	validate (callback) {
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
		BoundAsync.series(this, [
			this.validateEdits,
			this.validateLocations
		], callback);
	}

	// validate the edits array
	validateEdits (callback) {
		for (let i = 0, length = this.request.body.edits.length; i < length; i++) {
			let edit = this.request.body.edits[i];
			let error = this.validateEdit(edit);
			if (error) {
				return callback(this.errorHandler.error('invalidParameter', { info: `edits (#${i}): ${error}` }));
			}
		}
		process.nextTick(callback);
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
	validateLocations (callback) {
		if (!this.request.body.locations) {
			// no locations provided, we'll fetch them from the database and calculate
			// for all of them
			return callback();
		}
		let markerIds = Object.keys(this.request.body.locations);
		for (let i = 0, length = markerIds; i < length; i++) {
			let markerId = markerIds[i];
			// validate the marker ID
			if (!this.objectIdSafe(markerId)) {
				return callback(this.errorHandler.error('validation', { info: `${markerId} is not a valid marker ID` }));
			}
			// validate the location array, which must conform to a strict format
			let location = this.request.body.locations[markerId];
			let result = MarkerCreator.validateLocation(location);
			if (result) {
				return callback(this.errorHandler.error('validation', { info: `not a valid location for marker ${markerId}: ${result}` }));
			}
		}
		process.nextTick(callback);
	}

	// get any markers associated with the original commit, if any
	getOriginalCommitMarkers (callback) {
		if (this.request.body.locations) {
			// the client provided some locations to calculate for, so no need
			// to fetch from the database
			return callback();
		}
		else if (!this.streamId || !this.originalCommitHash) {
			return callback(this.errorHandler.error('parameterRequired', { info: 'locations, or streamId and originalCommitHash' }));
		}
		let id = `${this.streamId}|${this.originalCommitHash}`;
		this.data.markerLocations.getByQuery(
			{ _id: id },
			(error, markerLocations) => {
				if (error) { return callback(error); }
				this.originalMarkerLocations = (markerLocations && markerLocations[0]) || {};
				callback();
			},
			{
				databaseOptions: {
					hint: { _id: 1 }
				}
			}
		);
	}

	// get the stream, as needed
	getStream (callback) {
		if (!this.streamId) {
			return callback();	// client does not need to provide a stream, but we won't be saving anything
		}
		this.data.streams.getById(
			this.streamId,
			(error, stream) => {
				if (error) { return callback(error); }
				if (!stream) {
					return callback(this.errorHandler.error('notFound', { info: 'stream' }));
				}
				if (stream.get('type') !== 'file') {
					return callback(this.errorHandler.error('updateAuth', { reason: 'must be file stream' }));
				}
				if (stream.get('teamId') !== this.teamId) {
					return callback(this.errorHandler.error('updateAuth', { reason: 'stream must be from team' }));
				}
				this.stream = stream;
				callback();
			}
		);
	}

	// calculate the locations of any markers we can given the input data
	calculateNewCommitMarkers (callback) {
		// either the client provided us with locations, or we got them from the database
		let locations = this.request.body.locations || this.originalMarkerLocations.get('locations');
		// now calculate new marker locations given the edits passed in
		let markerMapper = new MarkerMapper(
			locations,
			this.request.body.edits
		);
		markerMapper.getUpdatedMarkerData(
			(error, calculatedMarkerLocations) => {
				if (error) { return callback(error); }
				this.calculatedMarkerLocations = calculatedMarkerLocations;
				process.nextTick(callback);
			}
		);
	}

	// prepare the newly calculate marker locations for update
	prepareForUpdate (callback) {
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
		process.nextTick(callback);
	}

	// update marker locations for the new commit
	update (callback) {
		if (!this.newCommitHash) {
			return callback();	// client can request not to save, indicated by no newCommitHash
		}
		let id = `${this.streamId}|${this.newCommitHash}`;
		let update = {
			$set: this.update
		};
		update.$set.teamId = this.teamId;
		if (this.isForTesting()) { // special for-testing header for easy wiping of test data
			update.$set._forTesting = true;
		}
		this.data.markerLocations.applyOpById(
			id,
			update,
			callback,
			{
				databaseOptions: {
					upsert: true
				}
			}
		);
	}

	// after processing the request...
	postProcess (callback) {
		if (!this.newCommitHash) {
			// we assume that if the client doesn't want them saved (indicated by no newCommitHash), they don't want them published
			return callback();
		}
		// publish the marker locations update to users in the team
		this.publishMarkerLocations(callback);
	}

	// publish the marker locations update to users in the team
	publishMarkerLocations (callback) {
		let channel = 'team-' + this.teamId;
		let message = {
			markerLocations: {
				teamId: this.teamId,
				streamId: this.streamId,
				commitHash: this.newCommitHash,
				locations: this.publish
			},
			requestId: this.request.id
		};
		this.api.services.messager.publish(
			message,
			channel,
			error => {
				if (error) {
					// this doesn't break the chain, but it is unfortunate...
					this.warn(`Could not publish marker location calculations update to team ${this.teamId}: ${JSON.stringify(error)}`);
				}
				callback();
			},
			{
				request: this
			}
		);
	}
}

module.exports = CalculateMarkerLocationsRequest;
