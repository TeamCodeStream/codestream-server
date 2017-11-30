'use strict';

var RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var ArrayUtilities = require(process.env.CS_API_TOP + '/lib/util/array_utilities');

const RELATIONAL_PARAMETERS = [
	'lt',
	'gt',
	'lte',
	'gte'
];

class GetMarkersRequest extends RestfulRequest {

	authorize (callback) {
		const required = ['teamId', 'streamId', 'commitHash'];
		for (let i = 0; i < required.length; i++) {
			let parameter = required[i];
			if (!this.request.query[parameter]) {
				return callback(this.errorHandler.error('parameterRequired', { info: parameter }));
			}
			this[parameter] = decodeURIComponent(this.request.query[parameter]).toLowerCase();
		}
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
		BoundAsync.series(this, [
			this.validate,
			this.fetchMarkerLocations,
			this.sortMarkers,
			this.fetchMarkerIds,
			this.fetchMissingMarkers,
			this.setIds,
			this.fetchMarkers,
			this.marryMarkers
		], error => {
			if (error === true) {
				this.responseData = { noMarkerLocationsForCommit: true};
				error = null;
			}
			callback(error);
		});
	}

	validate (callback) {
		let error = this.validateIds() ||
			this.validateRelational();
		if (error) {
			return callback(error);
		}
		else {
			process.nextTick(callback);
		}
	}

	validateIds () {
		if (this.request.query.ids) {
			this.ids = decodeURIComponent(this.request.query.ids).toLowerCase().split(',');
			if (this.ids.length > 100) {
				return this.errorHandler.error('badQuery', { reason: 'too many IDs' });
			}
		}
	}

	validateRelational () {
		let relationals = ArrayUtilities.intersection(Object.keys(this.request.query), RELATIONAL_PARAMETERS);
		if (relationals.length > 1) {
			return this.errorHandler.error('badQuery', { reason: 'only one relational parameter allowed' });
		}
		else if (relationals.length === 1) {
			this.relational = relationals[0];
			this.relationalValue = parseInt(this.request.query[this.relational], 10);
			if (isNaN(this.relationalValue)) {
				return this.errorHandler.error('badQuery', { reason: `value of ${this.relational} must be a number` });
			}
		}
		this.relational = this.relational || 'gte';
		this.relationalValue = this.relationalValue || 0;
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
				if (markerLocations.length === 0) {
					return callback(true); // short-circuit
				}
				this.markerLocations = markerLocations[0].get('locations');
				callback();
			}
		);
	}

	sortMarkers (callback) {
		this.sortedMarkers = Object.keys(this.markerLocations).map(markerId => {
			let location = this.markerLocations[markerId];
			return {
				markerId: markerId,
				startLine: location[0],
				endLine: location[1] || location[0]
			};
		});
		let sortFunction = this.relational.match(/^gt/) ? this.sortAscending : this.sortDescending;
		this.sortedMarkers.sort((a, b) => {
			return sortFunction(a, b);
		});
		process.nextTick(callback);
	}

	sortAscending (a, b) {
		if (a.endLine === b.endLine) {
			return a.markerId.localeCompare(b.markerId);
		}
		else {
			return a.endLine - b.endLine;
		}
	}

	sortDescending (a, b) {
		if (b.startLine === a.startLine) {
			return b.markerId.localeCompare(a.markerId);
		}
		else {
			return b.startLine - a.startLine;
		}
	}

	fetchMarkerIds (callback) {
		if (this.stream.get('numMarkers') <= this.sortedMarkers.length) {
			return callback();	// no missing markers
		}
		let query = {
			teamId: this.teamId,
			streamId: this.streamId
		};
		this.data.markers.getByQuery(
			query,
			(error, markers) => {
				if (error) { return callback(error); }
				this.allMarkerIds = markers.map(marker => marker._id);
				callback();
			},
			{
				databaseOptions: {
					fields: ['_id'],
				},
				noCache: true
			}
		);
	}

	fetchMissingMarkers (callback) {
		if (!this.allMarkerIds) {
			this.markers = [];
			return callback();
		}
		if (this.allMarkerIds.length < this.stream.get('numMarkers')) {
			this.warn(`Found ${this.allMarkerIds.length} markers for stream ${this.stream.id} but stream should have ${this.stream.get('numMarkers')}`);
		}
		let missingMarkerIds = ArrayUtilities.difference(this.allMarkerIds, Object.keys(this.markerLocations));
		missingMarkerIds = missingMarkerIds.map(markerId => this.data.markers.objectIdSafe(markerId));
		let query = {
			teamId: this.teamId,
			_id: { $in: missingMarkerIds }
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

	setIds (callback) {
		if (this.ids) {
			return callback();
		}

		let startIndex = this.sortedMarkers.findIndex(marker => {
			return this.markerInView(marker);
		});
		if (startIndex === -1) {
			this.ids = [];
			return callback();
		}

		const maxMarkers = this.api.config.limits.maxMarkersPerRequest;
		let endIndex = startIndex + maxMarkers;
		let lastMarker = this.sortedMarkers[endIndex - 1];
		while (endIndex < this.sortedMarkers.length) {
			if (!this.markerIsSameLine(this.sortedMarkers[endIndex], lastMarker)) {
				break;
			}
			endIndex++;
		}

		if (endIndex < this.sortedMarkers.length) {
			this.responseData.more = true;
		}
		let wantMarkers = this.sortedMarkers.slice(startIndex, endIndex);
		this.ids = wantMarkers.map(marker => marker.markerId);
		process.nextTick(callback);
	}

	markerInView (marker) {
		switch (this.relational) {
			case 'lt':
				return marker.startLine < this.relationalValue;
			case 'lte':
				return marker.startLine <= this.relationalValue;
			case 'gt':
				return marker.endLine > this.relationalValue;
			case 'gte':
				return marker.endLine >= this.relationalValue;
		}
	}

	markerIsSameLine (marker, lastMarker) {
		return (
			(
				this.relational.match(/^lt/) &&
				marker.startLine === lastMarker.startLine
			) ||
			(
				this.relational.match(/^gt/) &&
				marker.endLine === lastMarker.endLine
			)
		);
	}

	fetchMarkers (callback) {
		this.responseData.markers = [];
		if (this.ids.length === 0) {
			return callback();
		}
		let ids = this.ids.map(id => this.data.markers.objectIdSafe(id));
		let query = {
			teamId: this.teamId,
			_id: { $in: ids }
		};
		this.data.markers.getByQuery(
			query,
			(error, markers) => {
				if (error) { return callback(error); }
				this.markers = this.markers.concat(markers);
				callback();
			}
		);
	}

	marryMarkers (callback) {
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
