// this class should be used to create all marker documents in the database

'use strict';

var ModelCreator = require(process.env.CS_API_TOP + '/lib/util/restful/model_creator');
var Marker = require('./marker');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class MarkerCreator extends ModelCreator {

	get modelClass () {
		return Marker;	// class to use to create a marker model
	}

	get collectionName () {
		return 'markers';	// data collection to use
	}

	// convenience wrapper
	createMarker (attributes, callback) {
		return this.createModel(attributes, callback);
	}

	// these attributes are required or optional to create a marker document
	getRequiredAndOptionalAttributes () {
		return {
			required: {
				string: ['teamId', 'streamId', 'postId', 'commitHash'],
				'array': ['location']
			}
		};
	}

	// validate the input attributes
	validateAttributes (callback) {
		this.validateLocationAttribute(callback);
	}

	// validate the passed location for the marker
	validateLocationAttribute (callback) {
		let error = MarkerCreator.validateLocation(this.attributes.location);
		if (error) {
			return callback(error);
		}
		this.location = this.attributes.location;
		delete this.attributes.location; // this actually goes into the markerLocations structure, stored separately
		callback();
	}

	// validate a marker location, must be in the strict format:
	// [lineStart, columnStart, lineEnd, columnEnd, fifthElement]
	// the first four elements are coordinates and are required
	// the fifth element must be an object and can contain additional information about the marker location
	static validateLocation (location) {
		if (!(location instanceof Array)) {
			return 'location must be an array';
		}
		else if (location.length < 4) {
			return 'location array must have at least 4 elements';
		}
		else if (location.length > 5) {
			return 'location array is too long';
		}
		let firstFour = location.slice(0, 4);
		if (firstFour.find(coordinate => typeof coordinate !== 'number')) {
			return 'first four coordinations of location array must be numbers';
		}
		if (location.length === 5 && typeof location[4] !== 'object') {
			return 'fifth element of location must be an object';
		}
	}

	// right before the document is saved...
	preSave (callback) {
		if (this.request.isForTesting()) { // special for-testing header for easy wiping of test data
			this.attributes._forTesting = true;
		}
		BoundAsync.series(this, [
			this.normalizeMarkerAttributes,	// normalize the attributes for the marker
			this.updateMarkerLocations,		// update the marker's location for the particular commit
			super.preSave					// proceed with the save...
		], callback);
	}

	// create an ID for this marker
	normalizeMarkerAttributes (callback) {
		this.attributes._id = this.data.markers.createId();	 // pre-allocate an ID
		this.attributes.commitHashWhenCreated = this.attributes.commitHash; // save commitHash as commitHashWhenCreated
		delete this.attributes.commitHash;
		this.attributes.numComments = 1; // the original post for this marker, so there is 1 comment so far
		callback();
	}

	// update the location of this marker in the marker locations structure for this stream and commit
	updateMarkerLocations (callback) {
		let id = `${this.attributes.streamId}|${this.attributes.commitHashWhenCreated}`.toLowerCase();
		let op = {
			$set: {
				teamId: this.attributes.teamId,
				[`locations.${this.attributes._id}`]: this.location
			}
		};
		if (this.request.isForTesting()) { // special for-testing header for easy wiping of test data
			op.$set._forTesting = true;
		}
		this.data.markerLocations.applyOpById(id, op, callback, { databaseOptions: { upsert: true }});
	}
}

module.exports = MarkerCreator;
