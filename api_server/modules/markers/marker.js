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
		this.lowerCase(this.attributes.teamId);
		this.lowerCase(this.attributes.streamId);
		this.lowerCase(this.attributes.postId);
		this.lowerCase(this.attributes.commitHashWhenCreated);
		super.preSave(callback, options);
	}

	// cheater function to force an attribute to be lowercase
	lowerCase (attribute) {
		if (typeof this.attributes[attribute] === 'string') {
			this.attributes[attribute] = this.attributes[attribute].toLowerCase();
		}
		else if (this.attributes[attribute] instanceof Array) {
			this.attributes[attribute] = this.attributes[attribute].map(elem => elem.toLowerCase());
		}
	}
}

module.exports = Marker;
