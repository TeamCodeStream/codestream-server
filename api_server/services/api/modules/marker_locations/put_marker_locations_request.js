// handler for the "PUT /marker-locations" request

'use strict';

var RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var MarkerCreator = require(process.env.CS_API_TOP + '/services/api/modules/markers/marker_creator');

class PutMarkerLocationsRequest extends RestfulRequest {

	// authorize the request
	authorize (callback) {
		// team ID and stream ID are required, and the user must have access to the stream
		if (!this.request.body.teamId || typeof this.request.body.teamId !== 'string') {
			return callback(this.errorHandler.error('attributeRequired', { info: 'teamId' }));
		}
		this.teamId = this.request.body.teamId.toLowerCase();
		if (!this.request.body.streamId || typeof this.request.body.streamId !== 'string') {
			return callback(this.errorHandler.error('attributeRequired', { info: 'streamId' }));
		}
		this.streamId = this.request.body.streamId.toLowerCase();
		this.user.authorizeStream(this.streamId, this, (error, stream) => {
			if (error) { return callback(error); }
			if (!stream || stream.get('type') !== 'file') {
				return callback(this.errorHandler.error('updateAuth', { reason: 'not a file stream' }));
			}
			if (stream.get('teamId') !== this.teamId) {
				// stream must be owned by the given team, this anticipates sharding where this query
				// may not return a valid stream even if it exists but is not owned by the same team
				return callback(this.errorHandler.error('notFound', { info: 'stream' }));
			}
			process.nextTick(callback);
		});
	}

	// process the request...
	process (callback) {
		BoundAsync.series(this, [
			this.validate,	// validate input parameters
			this.handleLocations,	// handle the locations set (validate and prepare for save and broadcast)
			this.update		// do the actual update
		], callback);
	}

	// validate the request's input parameters
	validate (callback) {
		if (!this.request.body.commitHash || typeof this.request.body.commitHash !== 'string') {
			return callback(this.errorHandler.error('attributeRequired', { info: 'commitHash' }));
		}
		this.commitHash = this.request.body.commitHash.toLowerCase();
		if (!this.request.body.locations) {
			return callback(this.errorHandler.error('attributeRequired', { info: 'locations' } ));
		}
		if (typeof this.request.body.locations !== 'object') {
			return callback(this.errorHandler.error('validation', { info: 'locations must be an object' }));
		}
		if (Object.keys(this.request.body.locations).length > 1000) {
			return callback(this.errorHandler.error('validation', { info: 'locations object is too large, please break into pieces of less than 1000 elements '}));
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
