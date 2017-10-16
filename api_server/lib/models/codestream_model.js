'use strict';

var Data_Model = require(process.env.CS_API_TOP + '/lib/util/data_collection/data_model');
var CodeStream_Model_Validator = require('./codestream_model_validator');

class CodeStream_Model extends Data_Model {

	get_validator () {
		return new CodeStream_Model_Validator();
	}

	set_defaults () {
		const now = new Date().getTime();
		Object.assign(
			this.attributes,
			{
				deactivated: false,
				created_at: now,
				modified_at: now
			}
		);
		super.set_defaults();
	}

	pre_save (callback, options) {
		this.attributes.modified_at = new Date().getTime();
		super.pre_save(callback, options);
	}
}


module.exports = CodeStream_Model;
