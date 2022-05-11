// provides the Team model for handling teams

'use strict';

const CodeStreamModel = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/models/codestream_model');
const CodeStreamModelValidator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/models/codestream_model_validator');
const TeamAttributes = require('./team_attributes');
const ProviderFetcher = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/providers/provider_fetcher');
const ArrayUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/array_utilities');

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
		// we don't want to send secrets to the client, but the client needs the metadata
		if (object.serverProviderInfo) {
			object.serverProviderInfo = this.sanitizeServerProviderInfo(object.serverProviderInfo);
		}
		return object;
	}

	// get a sanitized form of serverProviderInfo stripped of the accessToken
	sanitizeServerProviderInfo (serverProviderInfo) {
		if (!serverProviderInfo) {
			return undefined;
		}
		const ret = {};
		for (const x in serverProviderInfo) {
			if (serverProviderInfo[x].multiple) {
				ret[x] = { multiple: {} };
				for (const y in serverProviderInfo[x].multiple) {
					const data = serverProviderInfo[x].multiple[y];
					delete data.accessToken;
					ret[x].multiple[y] = data;
				}
			} else {
				const data = { ...serverProviderInfo[x] };
				delete data.accessToken;
				ret[x] = data;
			}
		}
		return ret;
	}

	// get the members of the team, accounting for members who may have been removed
	getActiveMembers () {
		return ArrayUtilities.difference(
			ArrayUtilities.difference(
				this.attributes.memberIds || [],
				this.attributes.removedMemberIds || []
			),
			this.attributes.foreignMemberIds || []
		);
	}
}

module.exports = Team;
