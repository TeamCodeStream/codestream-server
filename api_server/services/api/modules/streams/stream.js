'use strict';

var CodeStreamModel = require(process.env.CS_API_TOP + '/lib/models/codestream_model');
var StreamValidator = require('./stream_validator');

class Stream extends CodeStreamModel {

	getValidator () {
		return new StreamValidator();
	}

	preSave (callback, options) {
		if (this.attributes.memberIds instanceof Array) {
			this.attributes.memberIds.sort();
		}
		super.preSave(callback, options);
	}
}

module.exports = Stream;
