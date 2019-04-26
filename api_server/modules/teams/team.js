// provides the Team model for handling teams

'use strict';

const CodeStreamModel = require(process.env.CS_API_TOP + '/lib/models/codestream_model');
const CodeStreamModelValidator = require(process.env.CS_API_TOP + '/lib/models/codestream_model_validator');
const TeamAttributes = require('./team_attributes');
const ProviderFetcher = require(process.env.CS_API_TOP + '/modules/users/provider_fetcher');

class Team extends CodeStreamModel {

	getValidator () {
		return new CodeStreamModelValidator(TeamAttributes);
	}

	// right before the teams is saved...
	async preSave (options) {
		// ensure referencing IDs are lower-cased
		this.lowerCase('memberIds');
		this.lowerCase('companyId');
		// ensure the array of member IDs is sorted
		if (this.attributes.memberIds instanceof Array) {
			this.attributes.memberIds.sort();
		}
		await super.preSave(options);
	}

	// get a sanitized object for return to the client (cleansed of attributes we don't want
	// the client to see)
	getSanitizedObject (options) {
		// how we store providerHosts for a team is different from what we return to clients,
		// so do that tranformation here
		const info = new ProviderFetcher({
			request: options.request,
			teams: [this]
		}).getThirdPartyProviders();
		const object = super.getSanitizedObject(options);
		if (info) {
			object.providerHosts = info.providerHosts[this.id];
		}
		return object;
	}
}

module.exports = Team;
