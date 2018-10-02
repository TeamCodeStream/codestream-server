// this class should be used to create all marker documents in the database

'use strict';

const ModelCreator = require(process.env.CS_API_TOP + '/lib/util/restful/model_creator');
const Marker = require('./marker');

class MarkerCreator extends ModelCreator {

	get modelClass () {
		return Marker;	// class to use to create a marker model
	}

	get collectionName () {
		return 'markers';	// data collection to use
	}

	// convenience wrapper
	async createMarker (attributes) {
		return await this.createModel(attributes);
	}

	// these attributes are required or optional to create a marker document
	getRequiredAndOptionalAttributes () {
		return {
			required: {
				string: ['teamId', 'streamId', 'postId', 'postStreamId', 'commitHash'],
				object: ['codeBlock']
			},
			optional: {
				'array': ['location']
			}
		};
	}

	// validate the input attributes
	async validateAttributes () {
		// location attribute is not strictly required, for instance, a marker that
		// is associated with code that has not yet been committed will not have a location
		if (typeof this.attributes.location !== 'undefined') {
			return this.validateLocationAttribute();
		}
	}

	// validate the passed location for the marker
	async validateLocationAttribute () {
		const error = MarkerCreator.validateLocation(this.attributes.location);
		if (error) {
			return error;
		}
		this.location = this.attributes.location;
		delete this.attributes.location; // this actually goes into the markerLocations structure, stored separately
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
	async preSave () {
		if (this.request.isForTesting()) { // special for-testing header for easy wiping of test data
			this.attributes._forTesting = true;
		}
		this.normalizeMarkerAttributes();	// normalize the attributes for the marker
		await this.updateMarkerLocations();		// update the marker's location for the particular commit
		await super.preSave();					// proceed with the save...
	}

	// create an ID for this marker
	normalizeMarkerAttributes () {
		this.attributes._id = this.data.markers.createId();	 // pre-allocate an ID
		this.attributes.commitHashWhenCreated = this.attributes.commitHash; // save commitHash as commitHashWhenCreated
		delete this.attributes.commitHash;
		this.attributes.numComments = 1; // the original post for this marker, so there is 1 comment so far
		this.attributes.creatorId = this.request.user.id;
	}

	// update the location of this marker in the marker locations structure for this stream and commit
	async updateMarkerLocations () {
		if (!this.location) { return; }	// location is not strictly required, ignore if not provided
		const id = `${this.attributes.streamId}|${this.attributes.commitHashWhenCreated}`.toLowerCase();
		let op = {
			$set: {
				teamId: this.attributes.teamId,
				[`locations.${this.attributes._id}`]: this.location
			}
		};
		if (this.request.isForTesting()) { // special for-testing header for easy wiping of test data
			op.$set._forTesting = true;
		}
		await this.data.markerLocations.applyOpById(id, op, { databaseOptions: { upsert: true } });
	}
}

module.exports = MarkerCreator;
