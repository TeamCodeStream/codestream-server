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

	lowerCase (attribute) {
		if (typeof this.attributes[attribute] === 'string') {
			this.attributes[attribute] = this.attributes[attribute].toLowerCase();
		}
		else if (this.attributes[attribute] instanceof Array) {
			this.attributes[attribute] = this.attributes[attribute].map(elem => elem.toLowerCase());
		}
	}
}


module.exports = CodeStreamModel;
