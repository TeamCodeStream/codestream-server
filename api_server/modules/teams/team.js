// provides the Team model for handling teams

'use strict';

const CodeStreamModel = require(process.env.CS_API_TOP + '/lib/models/codestream_model');
const CodeStreamModelValidator = require(process.env.CS_API_TOP + '/lib/models/codestream_model_validator');
const TeamAttributes = require('./team_attributes');

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
	getSanitizedObject () {
		// in addition to normal sanitization, we need to remove and client secrets from the 
		// providerHosts attribute
		const object = super.getSanitizedObject();
		if (typeof object.providerHosts === 'object') {
			Object.keys(object.providerHosts).forEach(provider => {
				const hostsForProvider = object.providerHosts[provider];
				if (typeof hostsForProvider === 'object') {
					Object.keys(hostsForProvider).forEach(host => {
						const hostAttributes = hostsForProvider[host];
						if (typeof hostAttributes === 'object') {
							delete hostAttributes.appClientSecret;
						}
					});
				}
			});
		}
		return object;
	}

}

module.exports = Team;
