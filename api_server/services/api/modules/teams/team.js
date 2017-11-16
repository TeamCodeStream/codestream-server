'use strict';

var CodeStreamModel = require(process.env.CS_API_TOP + '/lib/models/codestream_model');
var CodeStreamModelValidator = require(process.env.CS_API_TOP + '/lib/models/codestream_model_validator');
const TeamAttributes = require('./team_attributes');

class Team extends CodeStreamModel {

	getValidator () {
		return new CodeStreamModelValidator(TeamAttributes);
	}

	preSave (callback, options) {
		this.attributes.memberIds.sort();
		super.preSave(callback, options);
	}
}

module.exports = Team;
