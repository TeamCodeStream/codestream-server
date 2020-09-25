'use strict';

import React from 'react';
// import PropTypes from 'prop-types';

class Panel2 extends React.Component {
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
			<div className="Panel2 layout-pane-panel2">
				<div className="row justify-content-center">
					<div className="col-11 col-sm-10 col-md-12">
						<p>
							here is some text for the Panel2 pane. Justo eirmod diam justo ut dolores ea clita invidunt accusam. Sit sit dolor stet voluptua duo
							rebum, justo sea sit. Takimata et sanctus voluptua clita ipsum accusam est sea sit, sed erat tempor amet no dolore et gubergren et,
							labore.
						</p>
						{this.props.sectionData.map((s) => (
							<div className="row justify-content-center" key={s.id}>
								{/* col-10: default to using 10 of the 12 columns */}
								{/* col-sm-8: at md breakpoint, use 8 of the 12 columns or 2/3 the width */}
								{/* col-md-6: at md breakpoint, use 6 of the 12 columns or 1/2 the width */}
								{/* col-lg-4: at lg breakpoint, use 4 of the 12 columns or 1/3 the width */}
								{/* col-xl-3: at xl breakpoint, use 3 of the 12 columns or 1/4 the width */}
								<section className="col-12 col-sm-6 col-md-4 col-lg-3">
									<b>{s.settingName}</b>: {s.settingValue}
									{/* <ul>
									{this.props.sectionData.map((s) => (
										<OneSetting key={s.id} {...s} />
									))}
								</ul> */}
								</section>
							</div>
						))}
					</div>
				</div>
			</div>
		);
	}
}

// Panel2.propTypes = {
// 	config: PropTypes.object.isRequired,
// 	support: PropTypes.object.isRequired
// };

export default Panel2;
