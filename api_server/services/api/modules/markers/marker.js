// provides the Marker model for handling markers
// note that we don't derive from the standard CodeStreamModel here,
// so we don't have usual attributes like creatorId, createdAt, etc.
// these aren't necessary and we save a little space and bandwidth

'use strict';

var DataModel = require(process.env.CS_API_TOP + '/lib/util/data_collection/data_model');
var DataModelValidator = require(process.env.CS_API_TOP + '/lib/util/data_collection/data_model_validator');
const MarkerAttributes = require('./marker_attributes');

class Marker extends DataModel {

	getValidator () {
		return new DataModelValidator(MarkerAttributes);
	}

	// set defaults for a new marker
	setDefaults () {
		this.attributes.deactivated = false;
		super.setDefaults();
	}

	// called right before we save...
	preSave (callback, options) {
		// ensure all IDs are lowercase
		this.attributes.teamId = this.attributes.teamId.toLowerCase();
		this.attributes.streamId = this.attributes.streamId.toLowerCase();
		this.attributes.postId = this.attributes.postId.toLowerCase();
		super.preSave(callback, options);
	}
}

module.exports = Marker;
