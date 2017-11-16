'use strict';

var DataModel = require(process.env.CS_API_TOP + '/lib/util/data_collection/data_model');
var CodeStreamModelValidator = require('./codestream_model_validator');

class CodeStreamModel extends DataModel {

	getValidator () {
		return new CodeStreamModelValidator();
	}

	setDefaults () {
		const now = new Date().getTime();
		Object.assign(
			this.attributes,
			{
				deactivated: false,
				createdAt: now,
				modifiedAt: now
			}
		);
		super.setDefaults();
	}

	preSave (callback, options) {
		this.attributes.modifiedAt = new Date().getTime();
		super.preSave(callback, options);
	}
}


module.exports = CodeStreamModel;
