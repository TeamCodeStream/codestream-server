'use strict';

var RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var MarkerCreator = require(process.env.CS_API_TOP + '/services/api/modules/markers/marker_creator');

class PutMarkerLocationsRequest extends RestfulRequest {

	authorize (callback) {
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
				return callback(this.errorHandler.error('notFound', { info: 'stream' }));
			}
			process.nextTick(callback);
		});
	}

	process (callback) {
		BoundAsync.series(this, [
			this.validate,
			this.handleLocations,
			this.update
		], callback);
	}

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

	handleLocation (markerId, callback) {
		if (!this.data.markerLocations.objectIdSafe(markerId)) {
			return callback(this.errorHandler.error('validation', { info: `${markerId} is not a valid marker ID` }));
		}
		let location = this.request.body.locations[markerId];
		let result = MarkerCreator.validateLocation(location);
		if (result) {
			return callback(this.errorHandler.error('validation', { info: `not a valid location for marker ${markerId}: ${result}` }));
		}
		this.update[`locations.${markerId}`] = location;
		this.publish[markerId] = location;
		process.nextTick(callback);
	}

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

	postProcess (callback) {
		this.publishMarkerLocations(callback);
	}

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
