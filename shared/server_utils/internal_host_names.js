
const determineInternalHost = (onPremProductType, service) => {
	// on docker-compose bridge networks, container names serve as hostnames
	const internalNetworkHostNames = {
		api: 'csapi',
		broadcaster: 'csbcast',
		mailout: 'csmailout',
		mongo: 'csmongo',
		rabbitmq: 'csrabbitmq',
		admin: 'csadmin',
	};
	return onPremProductType === 'Single Linux Host'
		? 'localhost'
		: onPremProductType === 'Single Mac Host'
		? 'host.docker.internal'
		: onPremProductType === 'Docker Compose'
		? internalNetworkHostNames[service]
		: // onPremProductType === 'On-Prem Development'
		'localhost';
};

module.exports = determineInternalHost;
