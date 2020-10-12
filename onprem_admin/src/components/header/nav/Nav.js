'use strict';

import React from 'react';
import PropTypes from 'prop-types';

import { connect } from 'react-redux';
import Actions, { globalNavItems } from '../../../store/actions/presentation';

import { Link } from '@reach/router';

class Nav extends React.Component {
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

	// navbar-dark: nav bar text should be lite as nav bg is dark
	// navbar-expand-$breakPoint: when to show non-mobile version of nav bar
	// navbar-nav: links live in this div
	// nav-item nav-link: use to define navbar items that are links
	// navbar-brand: logo/branding
	// To put nav links on the right. put them in a container (align to grid) or container-fluid
	// site-nav: to let us stule the nav bar later on
	// family-sans: see styles.css
	// ml-auto: automatically aligns to the left
	//
	// In navbar toggler, data-* class is a means to pass data attributes to some code via a tag
	// aria-label: for screen readers saying it outloud
	render() {
		return (
			<nav className="Nav text-uppercase navbar navbar-expand-md navbar-dark">
				<a className="navbar-brand" href="/status">
					{/* from the fontawesome library */}

					{/* <i className="fas fa-code"></i>
					CodeStream On-Prem */}

					{/* <img src="/s/images/codestream-light.svg" /> */}
					<svg height="30" width="260" viewBox="50 0 250 45">
						<image href="/s/images/codestream-light.svg" />
					</svg>
					{/* <span className="ml-5">On-Prem</span> */}
				</a>
				<button
					type="button"
					className="navbar-toggler"
					data-toggle="collapse"
					data-target="#myTogglerNav"
					aria-controls="#myTogglerNav"
					aria-label="Toggle Navigation"
				>
					<span className="navbar-toggler-icon"></span>
				</button>
				<section className="collapse navbar-collapse" id="myTogglerNav">
					<div className="navbar-nav ml-auto">
						{/* main: on-prem installation ID, installation type: single linux host */}
						<Link
							className={`nav-item nav-link ${this.props.activePane === globalNavItems.status ? 'active' : ''}`}
							to="/status"
							onClick={() => this.props.selectGlobalPane(globalNavItems.status)}
						>
							status
						</Link>
						<Link
							className={`nav-item nav-link ${this.props.activePane === globalNavItems.configuration ? 'active' : ''}`}
							to="/configuration/topology"
							onClick={() => this.props.selectGlobalPane(globalNavItems.configuration)}
						>
							configuration
						</Link>
						<Link
							className={`nav-item nav-link ${this.props.activePane === globalNavItems.updates ? 'active' : ''}`}
							to="/updates"
							onClick={() => this.props.selectGlobalPane(globalNavItems.updates)}
						>
							updates
							{this.props.pendingUpdates && <span className="badge badge-pill badge-primary mb-1">*</span>}
						</Link>
						<Link
							className={`nav-item nav-link ${this.props.activePane === globalNavItems.support ? 'active' : ''}`}
							to="/support"
							onClick={() => this.props.selectGlobalPane(globalNavItems.support)}
						>
							support
						</Link>
						<Link
							className={`nav-item nav-link ${this.props.activePane === globalNavItems.license ? 'active' : ''}`}
							to="/license"
							onClick={() => this.props.selectGlobalPane(globalNavItems.license)}
						>
							license
						</Link>
					</div>
				</section>
			</nav>
		);
	}
}

const mapState = state => ({
	activePane: state.presentation.nav.paneSelected,
	pendingUpdates: state.status.pendingUpdates || false,
});

const mapDispatch = (dispatch) => ({
	selectGlobalPane: (pane) => dispatch({ type: Actions.PRESENTATION_NAV_GLOBAL_SELECT, payload: pane }),
});

export default connect(mapState, mapDispatch)(Nav);
