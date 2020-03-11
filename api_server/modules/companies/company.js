// the Company model

'use strict';

const CodeStreamModel = require(process.env.CS_API_TOP + '/lib/models/codestream_model');
const CodeStreamModelValidator = require(process.env.CS_API_TOP + '/lib/models/codestream_model_validator');
const CompanyAttributes = require('./company_attributes');
const ArrayUtilities = require(process.env.CS_API_TOP + '/server_utils/array_utilities');

class Company extends CodeStreamModel {

	getValidator () {
		return new CodeStreamModelValidator(CompanyAttributes);
	}

	async getCompanyMemberCount (data) {
		const teams = await data.teams.getByIds(this.get('teamIds') || []);
		const memberIds = teams.reduce((memberIds, team) => {
			memberIds = ArrayUtilities.union(memberIds, team.get('memberIds') || []);
			return memberIds;
		}, []);

		// TODO: we should really just have a count function
		const members = await data.users.getByQuery(
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
