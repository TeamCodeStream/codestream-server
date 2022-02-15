// handle a GET /companies request to fetch multiple companies

'use strict';

const GetManyRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/get_many_request');

class GetCompaniesRequest extends GetManyRequest {

	// authorize this request according to the current user
	async authorize () {
		if (this.request.query.mine !== undefined) {
			// you always have permission to get companies you are a part of
			return;
		}
		else if (!this.request.query.ids) {
			// can't request companies without specifying IDs
			throw this.errorHandler.error('parameterRequired', { info: 'ids' });
		}
		const companyIds = decodeURIComponent(this.request.query.ids).split(',');
		if (!this.user.hasCompanies(companyIds)) {
			// user is not in at least one of these companies ... bummer dude
			throw this.errorHandler.error('readAuth');
		}
	}

	// process the request
	async process () {
		if (this.request.query.mine !== undefined) {
			// get companies i am in, the GetManyRequest class knows to look at this.ids
			this.ids = this.user.get('companyIds') || [];
		}
		await super.process();

		// get any companies the user is a member of (by email) in foreign environments,
		// to display in the organization switcher
		await this.getForeignCompanies();
	}

	// get any companies the user is a member of (by email) in foreign environments,
	// to display in the organization switcher
	async getForeignCompanies () {
		if (this.request.headers['x-cs-block-xenv']) {
			this.log('Not fetching foreign companies, blocked by header');
			return [];
		} else if (this.request.query.ids) {
			return [];
		}

		const companies = await this.api.services.environmentManager
			.fetchUserCompaniesFromAllEnvironments(this.user.get('email'));
		this.foreignCompanies = companies.map(company => {
			company.company.host = company.host;
			company.company.host.accessToken = company.company.accessToken;
			delete company.company.accessToken;
			return company.company;
		});
	}

	async handleResponse () {
		if (this.gotError) {
			return super.handleResponse();
		}

		// add any foreign (cross-environment) companies
		this.responseData.companies = [...this.responseData.companies, ...(this.foreignCompanies || [])];
		return super.handleResponse();
	}

	// describe this route for help
	static describe (module) {
		const description = GetManyRequest.describe(module);
		description.access = 'User must be a member of the companies requested';
		description.input.looksLike.mine = '<when present, return all the companies the current user is in>';
		return description;
	}
}

module.exports = GetCompaniesRequest;
