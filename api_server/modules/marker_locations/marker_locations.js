// provides the MarkerLocations model for handling marker locations
// note that we don't derive from the standard CodeStreamModel here,
// so we don't have usual attributes like creatorId, createdAt, etc.
// these aren't necessary and we save a little space and bandwidth

'use strict';

const DataModel = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/data_collection/data_model');
const DataModelValidator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/data_collection/data_model_validator');
const MarkerLocationsAttributes = require('./marker_locations_attributes');

class MarkerLocations extends DataModel {

	getValidator () {
		return new DataModelValidator(MarkerLocationsAttributes);
	}

	// called right before we save...
	async preSave (options) {
		// ensure all IDs are lowercase
		this.attributes.teamId = this.attributes.teamId.toLowerCase();
		this.attributes.streamId = this.attributes.streamId.toLowerCase();
		this.attributes.commitHash = this.attributes.commitHash.toLowerCase();
		await super.preSave(options);
	}

	// get a sanitized object for return to the client (cleansed of attributes we don't want
	// the client to see)
	getSanitizedObject (options) {
		// we don't use a mongo-generated ID for the MarkerLocations model, but instead
		// combine the stream ID and the commit hash and use that ... this ensures that
		// we never have a duplicate of the same information, since the stream ID and the
		// the commit hash uniquely define a set of marker locations ... but we don't expose
		// this little wrinkle to the client, so here we parse out the streamID and commit
		// hash and return them to the client separately
		let object = super.getSanitizedObject(options);
		if (object.id) {
			let parts = object.id.split('|');
			if (parts.length > 1) {
				delete object.id;
				object.streamId = parts[0];
				object.commitHash = parts[1];
			}
		}
		return object;
	}
}

module.exports = MarkerLocations;
