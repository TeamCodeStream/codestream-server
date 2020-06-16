class ProviderFetcher {

	constructor (options) {
		Object.assign(this, options);
	}

	// get the third-party issue providers that are available for issue codemark integration
	// this fetches the "standard" in-cloud providers, we'll add to this for providers for each individual team
	getThirdPartyProviders () {
		this.getStandardThirdPartyProviders() || [];
		this.getThirdPartyProvidersPerTeam();
		return {
			standardProviders: this.standardProviders,
			providerHosts: this.providerHosts
		};
	}

	getStandardThirdPartyProviders () {
		const providers = this.request.api.config.api.thirdPartyProviders || [];
		this.standardProviders = providers.reduce((prev, provider) => {
			const service = `${provider}Auth`;
			const serviceAuth = this.request.api.services[service];
			if (serviceAuth) {
				const standardInstance = serviceAuth.getStandardInstance(this.teams);
				if (standardInstance) {
					prev.push(standardInstance);
				}
			}
			return prev;
		}, []);
	}

	// get the third-party issue providers that are available for issue codemark integration,
	// on a per-team basis ... this will include all standard in-cloud providers (whether CodeStream
	// is on-prem or not), plus all on-prem providers for the particular team
	getThirdPartyProvidersPerTeam () {
		this.providerHosts = {};
		(this.teams || []).forEach(team => {
			const providers = this.getThirdPartyProvidersForTeam(team);
			this.providerHosts[team.id] = {};
			providers.forEach(provider => {
				this.providerHosts[team.id][provider.id] = provider;
			});
		});
	}

	getThirdPartyProvidersForTeam (team) {
		let teamInstances = [...this.standardProviders];
		const providerHosts = team.get('providerHosts') || {};
		Object.keys(providerHosts).forEach(provider => {
			const service = `${provider}Auth`;
			const serviceAuth = this.request.api.services[service];
			if (serviceAuth) {
				const instances = serviceAuth.getInstancesByConfig(providerHosts[provider]);
				teamInstances = [...teamInstances, ...instances];
			}
		});
		return teamInstances;
	}
}

module.exports = ProviderFetcher;
