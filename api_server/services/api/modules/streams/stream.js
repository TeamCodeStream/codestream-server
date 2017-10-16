'use strict';

var CodeStream_Model = require(process.env.CS_API_TOP + '/lib/models/codestream_model');
var Stream_Validator = require('./stream_validator');

class Stream extends CodeStream_Model {

	get_validator () {
		return new Stream_Validator();
	}

	pre_save (callback, options) {
		if (this.attributes.member_ids instanceof Array) {
			this.attributes.member_ids.sort();
		}
		super.pre_save(callback, options);
	}
}

module.exports = Stream;
