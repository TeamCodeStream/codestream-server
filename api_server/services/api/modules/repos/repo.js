'use strict';

var CodeStreamModel = require(process.env.CS_API_TOP + '/lib/models/codestream_model');
var CodeStreamModelValidator = require(process.env.CS_API_TOP + '/lib/models/codestream_model_validator');
var NormalizeURL = require('normalize-url');
const RepoAttributes = require('./repo_attributes');

class Repo extends CodeStreamModel {

	getValidator () {
		return new CodeStreamModelValidator(RepoAttributes);
	}

	preSave (callback, options) {
		this.attributes.url = NormalizeURL(this.attributes.url.toLowerCase());
		this.attributes.firstCommitHash = this.attributes.firstCommitHash.toLowerCase();
		super.preSave(callback, options);
	}
}

module.exports = Repo;
