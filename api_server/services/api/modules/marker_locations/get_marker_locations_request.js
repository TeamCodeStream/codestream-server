'use strict';

var RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class GetMarkerLocationsRequest extends RestfulRequest {

	authorize (callback) {
		if (!this.request.query.teamId) {
			return callback(this.errorHandler.error('parameterRequired', { info: 'teamId' }));
		}
		this.teamId = decodeURIComponent(this.request.query.teamId).toLowerCase();
		if (!this.request.query.streamId) {
			return callback(this.errorHandler.error('parameterRequired', { info: 'streamId' }));
		}
		this.streamId = decodeURIComponent(this.request.query.streamId).toLowerCase();
		this.user.authorizeStream(this.streamId, this, (error, stream) => {
			if (error) { return callback(error); }
			if (!stream) {
				return callback(this.errorHandler.error('readAuth'));
			}
			if (stream.get('teamId') !== this.teamId) {
				return callback(this.errorHandler.error('notFound', { info: 'stream' }));
			}
			this.stream = stream;
			process.nextTick(callback);
		});
	}

	process (callback) {
		BoundAsync.series(this, [
			this.require,
			this.findMarkerLocations,
		], callback);
	}

	require (callback) {
		this.requireParameters('query', ['teamId', 'streamId', 'commitHash'], callback);
	}

	findMarkerLocations (callback) {
//		let teamId = decodeURIComponent(this.request.query.teamId).toLowerCase();
		let streamId = decodeURIComponent(this.request.query.streamId).toLowerCase();
		let commitHash = decodeURIComponent(this.request.query.commitHash).toLowerCase();
		let query = {
//			teamId: teamId,	 // will be needed for sharding, but for now, we'll avoiding an index here
			_id: `${streamId}|${commitHash}`
		};
		this.data.markerLocations.getByQuery(
			query,
			(error, markerLocations) => {
				if (error) { return callback(error); }
				if (markerLocations.length === 0) {
					this.responseData.markerLocations = {};
					return callback();	// no matching marker locations for this commit, we'll just send an empty response
				}
				this.markerLocations = markerLocations[0];
				this.responseData.markerLocations = this.markerLocations.getSanitizedObject();
				this.responseData.numMarkers = this.stream.get('numMarkers');
				callback();
			},
			{
				databaseOptions: {
					hint: { _id: 1 }
				}
			}
		);
	}
}

module.exports = GetMarkerLocationsRequest;
