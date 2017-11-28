'use strict';

var DataModel = require(process.env.CS_API_TOP + '/lib/util/data_collection/data_model');
var DataModelValidator = require(process.env.CS_API_TOP + '/lib/util/data_collection/data_model_validator');
const MarkerAttributes = require('./marker_attributes');

class Marker extends DataModel {

	getValidator () {
		return new DataModelValidator(MarkerAttributes);
	}

	setDefaults () {
		this.attributes.deactivated = false;
		super.setDefaults();
	}

	preSave (callback, options) {
		this.attributes.teamId = this.attributes.teamId.toLowerCase();
		this.attributes.streamId = this.attributes.streamId.toLowerCase();
		this.attributes.postId = this.attributes.postId.toLowerCase();
		super.preSave(callback, options);
	}
}

module.exports = Marker;
