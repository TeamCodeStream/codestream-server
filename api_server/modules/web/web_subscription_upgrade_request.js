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
			this.log('User requesting subscription upgrade is not a member of company ' + this.companyId);
		}
		this.company = await this.data.companies.getById(this.companyId);
		if (!this.company) {
			this.warn(`Company ${this.companyId} not found`);
			return this.redirect404();
		}

		const unpaidPlans = ['14DAYTRIAL', '30DAYTRIAL', 'TRIALEXPIRED', 'FREEPLAN', 'SALES'];
		if (!unpaidPlans.includes(this.company.get('plan'))) {
			return super.render('error', {
				title: 'Subscription Changes',
				body: `Please contact <a href="mailto:sales@codestream.com">sales@codestream.com</a> if you would like to make changes to your subscription.`
			});
		}

		const memberCount = await this.company.getCompanyMemberCount(this.data);
		const offerCoupon = this.request.query.coupon !== undefined;
		const buyNowCouponCode = !offerCoupon && this.api.config.payments.stripe.buyNowCouponCode;
		const buyNowDiscount = !offerCoupon && (
			this.company.get('createdAt') > Date.now() - this.api.config.payments.discountPeriod
		);
		const templateProps = {
			companyId: this.companyId,
			companyName: this.company.get('name'),
			memberCount,
			minPaidSeats: this.api.config.payments.minPaidSeats,
			buyNowCouponCode,
			buyNowDiscount,
			offerCoupon,
			error: this.request.query.error,
			segmentKey: this.api.config.segment.webToken
		};
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
