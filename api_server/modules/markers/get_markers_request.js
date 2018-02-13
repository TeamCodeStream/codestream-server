// handle the "GET /markers" request to fetch multiple markers

'use strict';

var GetManyRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_many_request');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Indexes = require('./indexes');

class GetMarkersRequest extends GetManyRequest {

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
			this.fetchMarkerLocations, // if the user passes a commit hash, we give them whatever marker locations we have for that commit
			super.process	// do the usual "get-many" processing
		], callback);
	}

	// if the user provides a commit hash, we'll fetch marker locations associated with the markers for the stream,
	// if we can find any
	fetchMarkerLocations (callback) {
		if (!this.request.query.commitHash) {
			// no commit hash, so we're just returning markers with no location info
			return callback();
		}
		this.commitHash = this.request.query.commitHash.toLowerCase();
		let query = {
//			teamId: this.teamId, // will be needed for sharding, but for now, we'll avoid an index here
			_id: `${this.streamId}|${this.commitHash}`
		};
		this.data.markerLocations.getByQuery(
			query,
			(error, markerLocations) => {
				if (error) { return callback(error); }
				if (markerLocations.length === 0) {
					// no marker locations for this commit, oh well
					this.responseData.markerLocations = {};
					return callback();
				}
				this.markerLocations = markerLocations[0];
				this.responseData.markerLocations = this.markerLocations.getSanitizedObject();
				callback();
			},
			{
				databaseOptions: {
					hint: { _id: 1 }
				}
			}
		);
	}

	// build the database query to use to fetch the markers
	buildQuery () {
		let query = {
			teamId: this.teamId,
			streamId: this.streamId
		};
		if (this.request.query.ids) {
			// user specified some IDs, so restrict to those IDs
			let ids = decodeURIComponent(this.request.query.ids).toLowerCase().split(',');
			if (ids.length > 100) {
				return 'too many IDs';
			}
			query._id = this.data.markers.inQuerySafe(ids);
		}
		return query;
	}

	// get database options to associate with the database fetch request
	getQueryOptions () {
		return {
			databaseOptions: {
				hint: Indexes.byStreamId
			}
		};
	}
}

module.exports = GetMarkersRequest;
