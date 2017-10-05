'use strict';

var CodeStream_Model = require(process.env.CI_API_TOP + '/lib/models/codestream_model');
var CodeStream_Model_Validator = require(process.env.CI_API_TOP + '/lib/models/codestream_model_validator');
var Team_Attributes = require('./team_attributes');

class Team extends CodeStream_Model {

	get_validator () {
		return new CodeStream_Model_Validator(Team_Attributes);
	}

	pre_save (callback, options) {
		this.attributes.member_ids.sort();
		super.pre_save(callback, options);
	}
}

module.exports = Team;
