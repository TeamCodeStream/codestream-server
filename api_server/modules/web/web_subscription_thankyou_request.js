// handles the GET /web/subscription/thankyou/:companyId request,
// receiving the callback from a successful stripe payment
'use strict';

const WebRequestBase = require('./web_request_base');
const Stripe = require('stripe');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');
const Identify = require('./identify');

class WebSubscriptionThankyouRequest extends WebRequestBase {

	async authorize() {
		// no authorization needed
	}

	async process() {
		try {
			await this.validatePlan();
			await this.savePaymentInfo();

			const templateProps = {
				segmentKey: this.api.config.telemetry.segment.webToken,
				companyId: this.company.id,
				seats: this.subscription.quantity,
				frequency: this.plan.interval === 'year' ? 'Annual' : 'Monthly',
				coupon: this.coupon
			};
			await this.addIdentifyScript(templateProps);

			this.render('subscription_thankyou', templateProps);

			this.responseHandled = true;
		}
		catch (error) {
			// something bad happened -- redirect to failure screen
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			this.warn('Error redirecting for payment: ' + message);
			const code = typeof error === 'object' && error.code;
			this.redirectError(code);
			return;
		}
	}

	async addIdentifyScript(props) {
		const identifyOptions = {
			user: this.user,
			company: this.company,
			module: this.module,
			request: this
		};
		props.identifyScript = await Identify(identifyOptions);
	}

	// validate that the plan paid for matches the number of seats
	async validatePlan () {
		this.company = await this.data.companies.getById(this.request.params.companyId);
		if (!this.company) {
			throw this.errorHandler.error('notFound', { info: 'company' });
		}
		const sessionId = this.company.get('stripeSessionId');
		if (!sessionId) {
			throw this.errorHandler.error('notFound', { info: 'stripeSessionIUd' });
		}
		const memberCount = await this.company.getCompanyMemberCount(this.data);

		this.stripe = Stripe(this.api.config.payments.stripe.secretKey);
		this.session = await this.stripe.checkout.sessions.retrieve(sessionId);
		if (!this.session.subscription) {
			throw this.errorHandler.error('notFound', { info: 'subscription' });
		}

		this.subscription = await this.stripe.subscriptions.retrieve(this.session.subscription);

		this.plan = this.subscription.plan;
		if (!this.plan) {
			throw this.errorHandler.error('notFound', { info: 'plan' });
		}
		if (!this.subscription.quantity || this.subscription.quantity < memberCount) {
			throw this.errorHandler.error('invalidParameter', { reason: `paid seats (${this.subscription.quantity}) is less than the number of registered users in the company (${memberCount})`});
		}

		this.customer = await this.stripe.customers.retrieve(this.subscription.customer);
	}

	// save payment info with the company object
	async savePaymentInfo () {
		this.coupon = (
			this.subscription.discount &&
			this.subscription.discount.coupon &&
			this.subscription.discount.coupon.id
		) || '';

		const set = {
			plan: 'BUSINESS',
			planStartDate: this.subscription.start_date * 1000,
			planPayor: (this.user && this.user.id) || (this.customer && this.customer.email),
			planAmount: (this.plan.amount || 0) / 100,
			planFrequency: this.plan.interval === 'year' ? 'Annual' : 'Monthly',
			stripeInfo: {
				session: this.session.id,
				subscription: this.subscription.id,
				plan: this.plan.id,
				customer: this.customer && this.customer.id
			},
			planPaidSeats: this.subscription.quantity,
			planCoupon: this.coupon,
			modifiedAt: Date.now()
		};

		this.updateOp = await new ModelSaver({
			request: this,
			collection: this.data.companies,
			id: this.company.id
		}).save({ $set: set });
	}

	// after the request has been processed and response returned...
	async postProcess () {
		// notify all teams in this company of the change to the company object
		await Promise.all((this.company.get('teamIds') || []).map(async teamId => {
			await this.publishToTeam(teamId);
		}));
	}

	// publish the updated company object to the team
	async publishToTeam (teamId) {
		const channel = 'team-' + teamId;
		const message = {
			requestId: this.request.id,
			company: this.updateOp
		};
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate
			this.warn(`Unable to publish company update message to channel ${channel}: ${JSON.stringify(error)}`);
		}
	}

	redirectError (code) {
		let url = '/web/subscription/error';
		if (code) {
			url += `?error=${code}`;
		}
		this.response.redirect(url);
		this.responseHandled = true;
	}
}

module.exports = WebSubscriptionThankyouRequest;
