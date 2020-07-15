// handle the "GET /web/subscription/upgrade" request to upgrade subscription to CodeStream

'use strict';

const Identify = require('./identify');
const WebRequestBase = require('./web_request_base');

class SubscriptionUpgradeRequest extends WebRequestBase {

	async authorize () {
		// we'll handle authorization in the process phase
	}

	async process () {
		await this.checkAuthentication() && 
		await this.show();
	}

	async checkAuthentication () {
		// if no identity, redirect to the login page
		if (!this.user) {
			this.log(
				'Note: User requesting subscription upgrade but has no identity'
			);
			/*
			let redirect = `/web/login?url=${encodeURIComponent(this.request.path)}`;
			if (this.request.query.error) {
				redirect += `&error=${this.request.query.error}`;
			}
			if (this.request.query.errorData) {
				redirect += `&errorData=${this.request.query.errorData}`;
			}
			this.response.redirect(redirect);
			this.responseHandled = true;
			return false;
			*/
		}
		return true;
	}

	async show () {
		this.companyId = this.request.params.companyId.toLowerCase();
		if (this.user && !this.user.hasCompany(this.companyId)) {
			this.warn('User requesting subscription upgrade is not a member of company ' + this.companyId);
			return this.redirect404();
		}
		this.company = await this.data.companies.getById(this.companyId);
		if (!this.company) {
			this.warn(`Company ${this.companyId} not found`);
			return this.redirect4040();
		}

		const memberCount = await this.company.getCompanyMemberCount(this.data);
		const minMemberCount = Math.max(6, memberCount);
		const templateProps = {
			companyId: this.companyId,
			minMemberCount,
			error: this.request.query.error,
			segmentKey: this.api.config.segment.webToken
		};
		if (this.company.get('createdAt') > Date.now() - this.api.config.payments.discountPeriod) {
			templateProps.discount = true;
		}
		this.addIdentifyScript(templateProps);

		await super.render('subscription_upgrade', templateProps);
	}

	addIdentifyScript (props) {
		const identifyOptions = {
			user: this.user,
			company: this.company,
			module: this.module
		};
		props.identifyScript = Identify(identifyOptions);
	}

	redirect404 () {
		this.response.redirect('/web/404');
		this.responseHandled = true;
	}
}

module.exports = SubscriptionUpgradeRequest;
