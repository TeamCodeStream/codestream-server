'use strict';

var RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

/*
const BASIC_QUERY_PARAMETERS = [
	'teamId',
	'streamId',
	'commitHash',
	'ids'
];
*/

class GetMarkersRequest extends RestfulRequest {

	authorize (callback) {
		['teamId', 'streamId', 'commitHash'].forEach(parameter => {
			if (!this.request.query[parameter]) {
				return callback(this.errorHandler.error('parameterRequired', { info: parameter }));
			}
			this[parameter] = decodeURIComponent(this.request.query[parameter]).toLowerCase();
		});
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
		if (!this.stream.get('numMarkers')) {
			this.responseData = { streamHasNoMarkers: true };
			return callback();
		}
		if (this.request.query.ids) {
			this.ids = decodeURIComponent(this.request.query.ids).toLowerCase().split(',');
		}
		BoundAsync.series([
			this.fetchMarkerLocations,
			this.fetchMarkers,
			this.marryMarkers,
			this.formResponse
		], callback);
	}

	fetchMarkerLocations (callback) {
		let query = {
			teamId: this.teamId,
			_id: `${this.streamId}|${this.commitHash}`,
		};
		this.data.markerLocations.getByQuery(
			query,
			(error, markerLocations) => {
				if (error) { return callback(error); }
				this.markerLocations = markerLocations;
				callback();
			}
		);
	}

	fetchMarkers (callback) {
		if (
			this.markerLocations.length === 0 ||
			typeof this.markerLocations[0].locations !== 'object' ||
			Object.keys(this.markerLocations[0].locations).length === 0
		) {
			return callback();
		}
		let markerIds = this.ids || Object.keys(this.markerLocations.locations);
		let query = {
			teamId: this.teamId,
			_id: { $in: markerIds }
		};
		this.data.markers.getByQuery(
			query,
			(error, markers) => {
				if (error) { return callback(error); }
				this.markers = markers;
				callback();
			}
		);
	}

	marryMarkers (callback) {
		this.responseData = { markers: [] };
		if (!this.markers) {
			return callback();
		}
		BoundAsync.forEachLimit(
			this,
			this.markers,
			20,
			this.marryMarker,
			callback
		);
	}

	marryMarker (marker, callback) {
		let markerObject = marker.getSanitizedObject();
		markerObject.location = this.markerLocations[marker.id] || null;
		this.responseData.markers.push(markerObject);
		process.nextTick(callback);
	}
}

module.exports = GetMarkersRequest;
