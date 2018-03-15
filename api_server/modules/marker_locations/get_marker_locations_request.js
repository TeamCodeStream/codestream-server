// handler for the "GET /marker-locations" request to fetch marker locations for a given stream and commit

'use strict';

var RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class GetMarkerLocationsRequest extends RestfulRequest {

	// authorize the request
	authorize (callback) {
		this.user.authorizeFromTeamIdAndStreamId(
			this.request.query,
			this,
			(error, info) => {
				if (error) { return callback(error); }
				Object.assign(this, info);
				process.nextTick(callback);
			},
			{
				mustBeFileStream: true
			}
		);
	}

	// process the request...
	process (callback) {
		BoundAsync.series(this, [
			this.require,	// check for required parameters
			this.findMarkerLocations	// find marker locations based on team ID, stream ID, and commit
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
