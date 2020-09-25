'use strict';

import React from 'react';
import PropTypes from 'prop-types';

import { connect } from 'react-redux';
// // my actions
// import Actions from '../actions';
// // my reducers
// import reducer from '../reducers';

// import Store from '../../../store';

class Status extends React.Component {
	render() {
		return (
			<div className="Status layout-pane-status container-fluid">
				<div className="row justify-content-center">
					<div className="col-11 col-sm-10 col-md-12">
						<p>
							here is some text for the status pane. Justo eirmod diam justo ut dolores ea clita invidunt accusam. Sit sit dolor stet voluptua duo
							rebum, justo sea sit. Takimata et sanctus voluptua clita ipsum accusam est sea sit, sed erat tempor amet no dolore et gubergren et,
							labore.
						</p>
						<div className="d-flex justify-content-center">
							<ul>
								<li>Product: {this.props.installationType}</li>
								<li>API: {this.props.apiUrl} </li>
								<li>Database: {this.props.mongUrl}</li>
								<li>Installation ID: {this.props.installationId}</li>
								<li>OnPrem Version: {this.props.onPremVersion}</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

Status.propTypes = {
	installationId: PropTypes.string.isRequired,
	installationType: PropTypes.string.isRequired,
	onPremVersion: PropTypes.string.isRequired,
	apiUrl: PropTypes.string.isRequired,
	mongoUrl: PropTypes.string.isRequired,
};

// StatusComponent.defaultProps = {};

// returns data needed for this component
const mapState = (state) => ({
	installationId: state.config.sharedGeneral.installationId || '00000000-0000-0000-0000-000000000000',
	installationType: state.installation.installationType,
	onPremVersion: state.installation.onPremVersion,
	apiUrl: state.config.apiServer.publicApiUrl,
	mongoUrl: state.config.storage.mongo.url,
});

// returns behavior for the component
// const mapDispatchToProps = function() {
// 	return {};
// }

export default connect(mapState)(Status);
