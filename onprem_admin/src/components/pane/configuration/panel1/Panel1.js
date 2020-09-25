'use strict';

import React from 'react';
// import PropTypes from 'prop-types';

class Panel1 extends React.Component {
	// state = {};

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
			<div className="Panel1 layout-pane-panel1">
				<div className="row justify-content-center">
					<div className="col-11 col-sm-10 col-md-12">
						<p>
							here is some text for the Panel1 pane. Justo eirmod diam justo ut dolores ea clita invidunt accusam. Sit sit dolor stet voluptua duo
							rebum, justo sea sit. Takimata et sanctus voluptua clita ipsum accusam est sea sit, sed erat tempor amet no dolore et gubergren et,
							labore.
						</p>
					</div>
				</div>
			</div>
		);
	}
}

// Panel1.propTypes = {
// 	config: PropTypes.object.isRequired,
// 	support: PropTypes.object.isRequired
// };

export default Panel1;
