'use strict';

var CodeStreamModel = require(process.env.CS_API_TOP + '/lib/models/codestream_model');
var CodeStreamModelValidator = require(process.env.CS_API_TOP + '/lib/models/codestream_model_validator');
var NormalizeURL = require(process.env.CS_API_TOP + '/lib/util/url_normalizer/url_normalizer');
const RepoAttributes = require('./repo_attributes');

class Repo extends CodeStreamModel {

	getValidator () {
		return new CodeStreamModelValidator(RepoAttributes);
	}

	preSave (callback, options) {
		this.attributes.url = NormalizeURL(this.attributes.url);
		this.lowerCase('firstCommitHash');
		this.lowerCase('companyId');
		this.lowerCase('teamId');
		super.preSave(callback, options);
	}
}

module.exports = Repo;
