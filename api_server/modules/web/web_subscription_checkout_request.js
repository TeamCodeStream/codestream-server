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
console.warn('QUERY:', JSON.stringify(this.request.query, 0, 5));
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
			this.warn('Error redirecting for payment: ' + message);
console.warn(error instanceof Error ? error.stack : 'no stack');
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
					string: ['companyId', 'seats', 'pay-type']
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
		if (this.numSeats == NaN || this.numSeats.toString() !== this.request.query.seats.trim()) {
			throw this.errorHandler.error('invalidParameter', { info: 'seats' });
		}

		if (this.numSeats < 6) {
			this.response.redirect(`/web/subscription/upgrade/${this.request.query.companyId}?error=free`);
			this.responseHandled = true;
			return false;
		}

		const memberCount = await this.company.getCompanyMemberCount(this.data);
		if (memberCount > this.numSeats) {
			this.response.redirect(`/web/subscription/upgrade/${this.request.query.companyId}?error=tooFewSeats`);
			this.responseHandled = true;
			return false;
		}

		return true;
	}

	// create a stripe session for handling the payment
	async createStripeSession () {
		this.stripe = Stripe(this.api.config.payments.stripe.secretKey);
		const price = this.request.query['pay-type'] === 'annual' ? 'price_1H0AZ8JRr1pIIxkHdn5OTaWo' : 'plan_HC6pvNVtUBPqR4';
		const sessionData = {
			success_url: `${this.api.config.api.publicApiUrl}/web/subscription/thankyou/${this.company.id}`,
			cancel_url: `${this.api.config.api.publicApiUrl}/web/subscription/upgrade/${this.company.id}`,
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
		if (this.company.get('createdAt') > Date.now() - this.api.config.payments.discountPeriod) {
			sessionData.subscription_data = {
				coupon: 'vIMHF0yv'
			};
		}
		this.session = await this.stripe.checkout.sessions.create(sessionData);
console.warn('SESSION:', this.session);
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
