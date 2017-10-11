'use strict';

var CodeStream_Model = require(process.env.CI_API_TOP + '/lib/models/codestream_model');
var CodeStream_Model_Validator = require(process.env.CI_API_TOP + '/lib/models/codestream_model_validator');
var Normalize_URL = require('normalize-url');
const Repo_Attributes = require('./repo_attributes');

class Repo extends CodeStream_Model {

	get_validator () {
		return new CodeStream_Model_Validator(Repo_Attributes);
	}

	pre_save (callback, options) {
		this.attributes.url = Normalize_URL(this.attributes.url.toLowerCase());
		this.attributes.first_commit_sha = this.attributes.first_commit_sha.toLowerCase();
		super.pre_save(callback, options);
	}
}

module.exports = Repo;
