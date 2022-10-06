// the Company model

'use strict';

const CodeStreamModel = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/models/codestream_model');
const CodeStreamModelValidator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/models/codestream_model_validator');
const CompanyAttributes = require('./company_attributes');
const ArrayUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/array_utilities');

class Company extends CodeStreamModel {

	getValidator () {
		return new CodeStreamModelValidator(CompanyAttributes);
	}

	async getCompanyMemberCount (data) {
		const teams = await data.teams.getByIds(this.get('teamIds') || []);
		const memberIds = teams.reduce((memberIds, team) => {
			const teamMemberIds = team.getActiveMembers();
			memberIds = ArrayUtilities.union(memberIds, teamMemberIds);
			return memberIds;
		}, []);

		return data.users.countByQuery(
			{
				_id: data.users.inQuerySafe(memberIds),
				isRegistered: true,
				deactivated: false
			},
			{
				fields: ['_id'],
				hint: { _id: 1 }
			}
		);
		return members.length;
	}
}

module.exports = Company;
