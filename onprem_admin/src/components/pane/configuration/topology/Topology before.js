'use strict';

import React from 'react';
// import PropTypes from 'prop-types';
import { connect } from 'react-redux';
// import TelemetryActions, { telemetryDataIsMissing } from '../../../../store/actions/config/telemetry';

class Topology extends React.Component {
	// lifecycle methods
	componentDidMount() {
		// dom has been mounted in browser successfully
		// ajax calls, set timers & listeners, etc...
	}

	componentWillUnmount() {
		// component is about to be unmounted
		// cleanup timers & listeners
	}

	render() {
		return (
			<div className="Topology layout-pane-topology">
				{/* <div className="container-fluid"> */}
					<div className="row justify-content-center">
						<div className="col-10">
							<form className="form">
								<div className="form-row">
									<div className="form-inline col-12">
										<div className="form-group col-12">
											<label className="col-form-label col-4" htmlFor="apiPublicHostName">
												<strong>Public Hostname</strong>
											</label>
											<input type="text" className="form-control col-8" id="apiPublicHostName" placeholder="my-host.my-company.com" />
										</div>
									</div>
								</div>
								<div className="form-row">
									<div className="form-inline col-12">
										<div className="form-group col-6">
											<label className="col-form-label col-8" htmlFor="apiInsecurePort">
												<strong>API Insecure Port</strong>
											</label>
											<input type="number" className="form-control col-4" id="apiInsecurePort" placeholder="80" />
										</div>
										<div className="form-group col-6">
											<label className="col-form-label col-6" htmlFor="apiSecurePort">
												<strong>API Secure Port</strong>
											</label>
											<input type="number" className="form-control col-6" id="apiSecurePort" placeholder="443" />
										</div>
									</div>
								</div>
								<div className="form-row">
									<div className="form-inline col-12">
										<div className="form-group col-6">
											<label className="col-form-label col-8" htmlFor="broadcasterInsecurePort">
												<strong>Broadcaster Insecure Port</strong>
											</label>
											<input type="number" className="form-control col-4" id="broadcasterInsecurePort" placeholder="12080" />
										</div>
										<div className="form-group col-6">
											<label className="col-form-label col-6" htmlFor="broadcasterSecurePort">
												<strong>Broadcaster Secure Port</strong>
											</label>
											<input type="number" className="form-control col-6" id="broadcasterSecurePort" placeholder="12443" />
										</div>
									</div>
								</div>
								<div className="form-row">
									<div className="form-inline col-12">
										<div className="form-group col-6">
											<label className="col-form-label col-8" htmlFor="adminInsecurePort">
												<strong>Admin Insecure Port</strong>
											</label>
											<input type="number" className="form-control col-4" id="adminInsecurePort" placeholder="8080" />
										</div>
										<div className="form-group col-6">
											<label className="col-form-label col-6" htmlFor="adminSecurePort">
												<strong>Admin Secure Port</strong>
											</label>
											<input type="number" className="form-control col-6" id="adminSecurePort" placeholder="8443" />
										</div>
									</div>
								</div>
								<div className="form-row">
									<div className="form-inline col-12">
										<div className="form-group col-12">
											<label className="col-form-label col-4" htmlFor="mongoUrl">
												<strong>MongoDB URL</strong>
											</label>
											<input
												type="text"
												className="form-control col-8"
												id="mongoUrl"
												placeholder="mongodb://localhost/codestream"
											></input>
										</div>
									</div>
								</div>
							</form>
						</div>
					</div>
					<div className="row justify-content-center">
						<div className="col-10">

						</div>
					</div>
					<div className="row justify-content-center">
						<p className="col-8">
							Your system's topology describes how your installation sits on your network and how your clients (users running CodeStream in their
							IDE) will connect to it. Proceed with caution when making changes to this section. If not verified before activation, they could
							inadvertantly leave you unable to connect.
						</p>
					</div>
				{/* </div> */}
			</div>
		);
	}
}

const mapState = state => ({
	api: state.config.apiServer,
	broadcaster: state.config.broadcastEngine?.codestreamBroadcaster || {},
	rabbitmq: state.config.queuingEngine?.rabbitmq || {},
	mongo: state.config.storage.mongo,
	ssl: state.config.ssl,
});

// const mapDispatch = dispatch => ({
// });

export default connect(mapState)(Topology);
