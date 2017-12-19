// handler for the "GET /marker-locations" request

'use strict';

var RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class GetMarkerLocationsRequest extends RestfulRequest {

	// authorize the request
	authorize (callback) {
		// must have a team ID and stream ID, and the user must have access to the stream
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
				// stream must be owned by the given team, this anticipates sharding where this query
				// may not return a valid stream even if it exists but is not owned by the same team
				return callback(this.errorHandler.error('notFound', { info: 'stream' }));
			}
			this.stream = stream;
			process.nextTick(callback);
		});
	}

	// process the request...
	process (callback) {
		BoundAsync.series(this, [
			this.require,	// check for required parameters
			this.findMarkerLocations,	// find marker locations based on team ID, stream ID, and commit
		], callback);
	}

	// these parameters are required for the request
	require (callback) {
		this.requireAllowParameters(
			'query',
			{
				required: {
					string: ['teamId', 'streamId', 'commitHash']
				}
			},
			callback
		);
	}

	// find the marker locations according to the input parameters
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
