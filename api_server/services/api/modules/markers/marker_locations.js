'use strict';

var DataModel = require(process.env.CS_API_TOP + '/lib/util/data_collection/data_model');
var DataModelValidator = require(process.env.CS_API_TOP + '/lib/util/data_collection/data_model_validator');
const MarkerLocationsAttributes = require('./marker_locations_attributes');

class MarkerLocations extends DataModel {

	getValidator () {
		return new DataModelValidator(MarkerLocationsAttributes);
	}

	preSave (callback, options) {
		this.attributes.teamId = this.attributes.teamId.toLowerCase();
		this.attributes.streamId = this.attributes.streamId.toLowerCase();
		this.attributes.commitHash = this.attributes.commitHash.toLowerCase();
		super.preSave(callback, options);
	}
}

module.exports = MarkerLocations;
