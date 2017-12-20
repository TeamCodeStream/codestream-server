// handler for the "PUT /marker-locations" request

'use strict';

var RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var MarkerCreator = require(process.env.CS_API_TOP + '/services/api/modules/markers/marker_creator');

class PutMarkerLocationsRequest extends RestfulRequest {

	// authorize the request
	authorize (callback) {
		this.user.authorizeFromTeamIdAndStreamId(
			this.request.body,
			this,
			(error, info) => {
				if (error) { return callback(error); }
				Object.assign(this, info);
				process.nextTick(callback);
			},
			{
				mustBeFileStream: true,
				error: 'updateAuth'
			}
		);
	}

	// process the request...
	process (callback) {
		BoundAsync.series(this, [
			this.require,	// check for required parameters
			this.validate,	// validate input parameters
			this.handleLocations,	// handle the locations set (validate and prepare for save and broadcast)
			this.update		// do the actual update
		], callback);
	}

	// these parameters are required for the request
	require (callback) {
		this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['teamId', 'streamId', 'commitHash'],
					object: ['locations']
				}
			},
			callback
		);
	}

	// validate the request's input parameters
	validate (callback) {
		this.commitHash = this.request.body.commitHash.toLowerCase();
		if (Object.keys(this.request.body.locations).length > 1000) {
			return callback(this.errorHandler.error('validation', { info: 'locations object is too large, please break into pieces of less than 1000 elements'}));
		}
		process.nextTick(callback);
	}

	// handle the locations set (validate and prepare for save and broadcast)
	handleLocations (callback) {
		this.update = {};
		this.publish = {};
		BoundAsync.forEachLimit(
			this,
			Object.keys(this.request.body.locations),
			20,
			this.handleLocation,
			callback
		);
	}

	// handle a single location array
	handleLocation (markerId, callback) {
		// validate the marker ID
		if (!this.data.markerLocations.objectIdSafe(markerId)) {
			return callback(this.errorHandler.error('validation', { info: `${markerId} is not a valid marker ID` }));
		}
		// validate the location array, which must conform to a strict format
		let location = this.request.body.locations[markerId];
		let result = MarkerCreator.validateLocation(location);
		if (result) {
			return callback(this.errorHandler.error('validation', { info: `not a valid location for marker ${markerId}: ${result}` }));
		}
		// prepare the data update and the broadcast
		this.update[`locations.${markerId}`] = location;	// for database update
		this.publish[markerId] = location;					// for publishing
		process.nextTick(callback);
	}

	// do the actual update
	update (callback) {
		let id = `${this.streamId}|${this.commitHash}`;
		let update = {
			$set: this.update
		};
		update.$set.teamId = this.teamId;
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
				commitHash: this.commitHash,
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
					this.warn(`Could not publish post message to team ${this.teamId}: ${JSON.stringify(error)}`);
				}
				callback();
			}
		);
	}
}

module.exports = PutMarkerLocationsRequest;
