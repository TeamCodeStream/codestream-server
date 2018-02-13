// provides the Team model for handling teams

'use strict';

var CodeStreamModel = require(process.env.CS_API_TOP + '/lib/models/codestream_model');
var CodeStreamModelValidator = require(process.env.CS_API_TOP + '/lib/models/codestream_model_validator');
const TeamAttributes = require('./team_attributes');

class Team extends CodeStreamModel {

	getValidator () {
		return new CodeStreamModelValidator(TeamAttributes);
	}

	// right before the teams is saved...
	preSave (callback, options) {
		// ensure referencing IDs are lower-cased
		this.lowerCase('memberIds');
		this.lowerCase('companyId');
		// ensure the array of member IDs is sorted
		this.attributes.memberIds.sort();
		super.preSave(callback, options);
	}
}

module.exports = Team;
