import React, { Component } from 'react';
// import PropTypes from 'prop-types';
import { Router } from '@reach/router';
import Status from './status/Status';
import Configuration from './configuration/Configuration';
import Updates from './updates/Updates';
import Support from './support/Support';
import License from './license/License';

class Pane extends Component {
	// state = {
	// 	config: this.props.config,
	// 	installation: this.props.installation
	// };

	render() {
		return (
			// <article className="Pane layout-pane">
			// 	<section className="container-fluid justify-content-center bg-secondary text-light">
			<section className="Pane layout-pane col-12">
				<Router>
					<Status path="/status" />
					<Configuration path="/configuration/*" />
					<Updates path="/updates" />
					<Support path="/support" />
					<License path="/license" />
				</Router>
			</section>
		);
	}
}

// PaneComponent.propTypes = {
// 	config: PropTypes.object.isRequired,
// 	installation: PropTypes.object.isRequired
// };

// PaneComponent.defaultProps = {
// };

// returns data needed for this component
// const componentData = function() {
// 	return {};
// }

// returns behavior for the component
// const componentBehavior = function() {
// 	return {};
// }

// const App = connect(componentData, componentBehavior)(AppComponent);
// const Pane = connect()(PaneComponent);
export default Pane;
