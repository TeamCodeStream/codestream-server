// handles the GET /web/subscription/checkout request, ultimately redirecting to stripe for payment
'use strict';

const WebRequestBase = require('./web_request_base');
const Stripe = require('stripe');

class WebSubscriptionCheckoutRequest extends WebRequestBase {

	async authorize() {
		// no authorization needed
	}

	async process() {
		try {
			await this.requireAndAllow();
			if (!await this.validate()) {
				// we've redirected back to the subscription upgrade page, with an error
				return;
			}
			await this.createStripeSession();
			await this.saveSessionId();
			
			// here we return a simple page that redirects to stripe's checkout, with the session ID embedded
			this.response.send(`
<html>
	<head>
		<script src="https://js.stripe.com/v3/"></script>
		<script>
			window.onload = function() { 
				var stripe = Stripe('${this.api.config.payments.stripe.publishableKey}');
				stripe.redirectToCheckout({ sessionId: '${this.session.id}' });
			};
		</script>
	</head>
	<body>
	</body>
</html>
`);
			this.responseHandled = true;
		}
		catch (error) {
			// something bad happened -- redirect to failure screen
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			if (message.match(/No such coupon/)) {
				error.code = 'invalid_coupon';
			}
			this.warn('Error redirecting for payment: ' + message);
			if (error instanceof Error) {
				this.warn(error.stack);
			}
			const code = typeof error === 'object' && error.code;
			this.redirectError(code);
			return;
		}
	}

	async requireAndAllow() {
		await this.requireAllowParameters(
			'query',
			{
				required: {
					string: ['companyId', 'seats', 'pay-type', 'coupon']
				}
			}
		);
	}

	async validate () {
		this.company = await this.data.companies.getById(this.request.query.companyId);
		if (!this.company) {
			throw this.errorHandler.error('notFound', { info: 'company' });
		}

		this.numSeats = parseInt(this.request.query.seats, 10);
		if (isNaN(this.numSeats) || this.numSeats < 1 || this.numSeats.toString() !== this.request.query.seats.trim()) {
			throw this.errorHandler.error('invalidParameter', { info: 'seats' });
		}

		const memberCount = await this.company.getCompanyMemberCount(this.data);
		if (memberCount > this.numSeats) {
			this.response.redirect(`/web/subscription/upgrade/${this.request.query.companyId}?error=tooFewSeats`);
			this.responseHandled = true;
			return false;
		}

		if (this.numSeats < this.api.config.payments.minPaidSeats) {
			this.response.redirect(`/web/subscription/upgrade/${this.request.query.companyId}?error=free`);
			this.responseHandled = true;
			return false;
		}

		return true;
	}

	// create a stripe session for handling the payment
	async createStripeSession () {
		this.stripe = Stripe(this.api.config.payments.stripe.secretKey);
		const price = this.request.query['pay-type'] === 'annual' ? 
			this.api.config.payments.stripe.annualPlanId : 
			this.api.config.payments.stripe.monthlyPlanId;
		const sessionData = {
			success_url: `${this.api.config.apiServer.publicApiUrl}/web/subscription/thankyou/${this.company.id}`,
			cancel_url: `${this.api.config.apiServer.publicApiUrl}/web/subscription/upgrade/${this.company.id}`,
			client_reference_id: this.company.id,
			payment_method_types: ['card'],
			line_items: [
				{
					price,
					quantity: this.numSeats
				},
			],
			mode: 'subscription'
		};
		if (this.request.query.coupon) {
			sessionData.subscription_data = {
				coupon: this.request.query.coupon
			};
		}
		else if (false /*this.company.get('createdAt') > Date.now() - this.api.config.payments.discountPeriod*/) {
			sessionData.subscription_data = {
				coupon: this.api.config.payments.stripe.buyNowCouponCode
			};
		}
		this.session = await this.stripe.checkout.sessions.create(sessionData);
	}

	// save the session ID with the company so we can reference it later
	async saveSessionId () {
		return this.data.companies.updateDirect(
			{ id: this.data.companies.objectIdSafe(this.company.id) },
			{ $set: { stripeSessionId: this.session.id } }
		);
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

module.exports = WebSubscriptionCheckoutRequest;
