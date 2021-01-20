'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import { integrationStatuses } from '../../store/actions/presentation';

// logic used by connected components which call an Accordion.
// return object with status properties for each accordion card
// {
// 	[cardId]: {
// 		status: on || off || disabled,
// 		icon: '/icon/file',
// 		onClickAction: dispatcher action type,
// 	},
// 	...
// }
export function getAccordionCardStatuses(state, cards) {
	const statusData = {};
	cards.forEach((card) => {
		statusData[card.id] = {
			status: card.statusSwitch?.getStatusFromState ? card.statusSwitch.getStatusFromState(state) : integrationStatuses.disabled,
		};
		if (card.statusSwitch) {
			switch (statusData[card.id].status) {
				case integrationStatuses.on:
					// statusData[card.id].badgeStatus = 'success';
					// statusData[card.id].badgeValue = 'CONFIGURAED';
					statusData[card.id].icon = '/s/fa/svgs/solid/toggle-on.svg.green.png';
					statusData[card.id].onClickAction = card.statusSwitch?.onClickAction;
					statusData[card.id].onClickActionPayload = card.statusSwitch?.onClickActionPayload;
					break;
				case integrationStatuses.off:
					// statusData[card.id].badgeStatus = 'dark';
					// statusData[card.id].badgeValue = 'UNCONFIGURAED';
					statusData[card.id].icon = '/s/fa/svgs/solid/toggle-off.svg.on-white.png';
					statusData[card.id].onClickAction = card.statusSwitch?.onClickAction;
					statusData[card.id].onClickActionPayload = card.statusSwitch?.onClickActionPayload;
					break;
				default:
					// integrationStatuses.disabled
					statusData[card.id].icon = '/s/fa/svgs/solid/toggle-off.svg.grey2-8e8e8e.solid-back.png';
					break;
			}
		}
	});
	console.debug('getAccordionCardStatuses()  statusData =', statusData);
	return statusData;
}

const AccordionHeaderContent = (props) => {
	const { dispatch, cardStatus, toggleAccordionCard } = props;
	const { id, header } = props.card;
	// console.debug(`Accordion.js (AccordionHeaderContent ${id}) cardStatus:`, cardStatus);
	if (cardStatus?.icon) {
		return (
			<span>
				<img
					className="icon-image ml-2 pb-1"
					src={cardStatus.icon}
					onClick={
						cardStatus?.onClickAction &&
						((e) => {
							console.debug('clicked the accordion header content image');
							dispatch({ type: cardStatus.onClickAction, payload: cardStatus.onClickActionPayload });
							// FIXME: this don't work!! - confirmed that this IS in fact, stopping
							// the event from bubbling up, but it IS NOT stopping the card from
							// opening or closing
							// e.stopPropagation();
							// e.preventDefault();
							// e.nativeEvent.stopImmediatePropagation();
							// toggleAccordionCard(id);
							console.debug(`card ${id} inputState = `, props.inputState);
						})
					}
				/>
				<span className="ml-2">{header}</span>
			</span>
		);
	}
	return (
		<span>
			{cardStatus?.badgeValue && <span className={`ml-2 badge badge-${cardStatus.badgeStatus}`}>{cardStatus.badgeValue}</span>}
			<span className="ml-2">{header}</span>
		</span>
	);
}

function accordionClicked(e) {
	console.debug('I clicked on the accordion');
	e.stopPropagation();
}

const AccordionCard = props => {
	console.debug(`Accordion(AccordionCard ${props.id})  prop =`, props);
	const { id, header } = props.card;
	return (
		<div className="card">
			<h5
				id={id}
				className={`card-head text-dark mb-0 ${props.inputState.cards[id]?.isCollapsed ? 'show collapsed' : 'show'}`}
				data-toggle="collapse"
				data-target={`#${id}Collapse`}
				aria-expanded={!props.inputState.cards[id]?.isCollapsed}
				aria-controls={`${id}Collapse`}
				onClick={(e) => accordionClicked(e)}
			>
				<AccordionHeaderContent
					card={props.card}
					cardStatus={props.cardStatus}
					dispatch={props.dispatch}
					toggleAccordionCard={props.toggleAccordionCard}
					inputState={props.inputState}
				/>
			</h5>
			<div
				id={`${id}Collapse`}
				className={`card-body bg-dark collapse ${!props.inputState.cards[id]?.isCollapsed ? 'show' : ''}`}
				aria-labelledby={id}
				data-parent={`#${props.accordionId}`}
			>
				{props.children}
			</div>
		</div>
	);
};

AccordionCard.propTypes = {
	accordionId: PropTypes.string.isRequired,
	card: PropTypes.object.isRequired,
	cardStatus: PropTypes.object,
};


// An unruly, data-driven Accordion component that's disconnect from the redux
// store. The Topology.js and Integrations.js components contain a good examples
// of what the data set used to drive this component look like.  Properties are
// defined next to the Accordion.propTypes definition below.

class Accordion extends React.Component {
	constructor(props) {
		// FIXME: deprecated - https://reactjs.org/docs/context.html
		super(props);
		console.debug('Accordion(constructor)  props =', this.props);
		const allCollapsed = typeof this.props.allCollapsed === 'boolean' ? this.props.allCollapsed : true;
		this.state = {
			allCollapsed,
			cards: {},
		};
		Object.keys(this.props.cards).forEach((cardId) => {
			const card = this.props.cards[cardId]
			if (!(card.id in this.state.cards)) this.state.cards[card.id] = {};
			this.state.cards[card.id].isCollapsed = allCollapsed;
		});
		// necessary when function calls this.getState() and we pass it to a child component
		this.toggleAccordionCard = this.toggleAccordionCard.bind(this);
		// this.revertField = this.revertField.bind(this);
		// FIXME - why do I need this bind?
		this.onClickCollapseAllToggle = this.onClickCollapseAllToggle.bind(this);
		console.debug('Accordion(constructor)  state =', this.state);
	}

	toggleAccordionCard(cardId) {
		const newState = Object.assign({}, this.state);
		newState.allCollapsed = true;
		console.debug(`**** newState; cardId = ${cardId}`, newState);
		Object.keys(newState.cards).forEach((cid) => {
			const card = newState.cards[cid];
			console.debug('card:', card);
			if (cid === cardId) card.isCollapsed = !card.isCollapsed;
			if (!card.isCollapsed) newState.allCollapsed = false;
		});
		this.setState(newState);
	}

	onClickCollapseAllToggle() {
		console.debug('onClickCollapseAllToggle. state =');
		const newCards = {};
		Object.keys(this.state.cards).forEach((cardId) => {
			const card = this.state.cards[cardId];
			newCards[cardId] = { isCollapsed: !this.state.allCollapsed };
		});
		this.setState({ cards: newCards, allCollapsed: !this.state.allCollapsed });
		console.debug('Accordion(onClickCollapseAllToggle)  state =', this.state);
	}

	// revertField() {
	// 	console.debug(`reverting field to ${this.state.revertValue}`);
	// 	this.setState({ errorMsg: null, value: this.state.revertValue });
	// }

	headerButtonList() {
		// console.debug('Accordion.HeaderButtonList: onClickPlus =', this.props.onClickPlus);
		if (this.props.onClickPlus && this.props.expandAllToggle) {
			return (
				<span className="mt-2">
					{/* <img className="icon-image-25x20 mr-3" src="/s/fa/svgs/solid/plus.svg.on-dark.png" /> */}
					<img
						className="icon-image-25x20 mr-2"
						src="/s/fa/svgs/solid/plus-square.svg.black-on-dark.png"
						style={{ cursor: 'pointer' }}
						onClick={this.props.onClickPlus}
					/>
					{this.state.allCollapsed ? (
						<img
							className="icon-image-25x20 mr-4"
							src="/s/fa/svgs/solid/angle-double-down.svg.black-on-dark.png"
							style={{ cursor: 'pointer' }}
							onClick={this.onClickCollapseAllToggle}
						/>
					) : (
						<img
							className="icon-image-25x20 mr-4"
							src="/s/fa/svgs/solid/angle-double-up.svg.black-on-dark.png"
							style={{ cursor: 'pointer' }}
							onClick={this.onClickCollapseAllToggle}
						/>
					)}
				</span>
			);
		} else if (this.props.onClickPlus) {
			return (
				<span className="mt-2">
					<img
						className="icon-image-25x20 mr-4"
						src="/s/fa/svgs/solid/plus-square.svg.black-on-dark.png"
						style={{ cursor: 'pointer' }}
						onClick={this.props.onClickPlus}
					/>
				</span>
			);
		} else if (this.props.expandAllToggle) {
			return (
				<span className="mt-2">
					{this.state.allCollapsed ? (
						<img
							className="icon-image-25x20 mr-4"
							src="/s/fa/svgs/solid/angle-double-down.svg.black-on-dark.png"
							style={{ cursor: 'pointer' }}
							onClick={this.onClickCollapseAllToggle}
						/>
					) : (
						<img
							className="icon-image-25x20 mr-4"
							src="/s/fa/svgs/solid/angle-double-up.svg.black-on-dark.png"
							style={{ cursor: 'pointer' }}
							onClick={this.onClickCollapseAllToggle}
						/>
					)}
				</span>
			);
		}
		return <></>;
	}

	render() {
		console.debug(`Accordion(render) ${Object.keys(this.props.cards).length} cards. props =`, this.props);
		return (
			<div className="Accordion container bg-secondary">
				<div className="row justify-content-between">
					<p>{this.props.message}</p>
					{this.headerButtonList()}
				</div>
				<div className="row">
					<div className="accordion col-12" id={this.props.accordionId}>
						{/* {Object.keys(this.props.newCardData).length ? (
							<AccordionCard
								key="newCard"
								card={this.props.newCardData}
								accordionId={this.props.accordionId}
								cardStatus={this.props.statuses?.newCard}
								dispatch={this.props.dispatch}
								inputState={this.state}
								toggleAccordionCard={this.toggleAccordionCard}
							>
								<span>{React.cloneElement(c.bodyComponent, c.bodyComponentProps)}</span>
							</AccordionCard>
						) : (
							<></>
						)} */}
						{this.props.cards.map((c) => (
							<AccordionCard
								key={c.id}
								card={c}
								accordionId={this.props.accordionId}
								// id={c.id}
								// header={c.header}
								cardStatus={this.props.statuses?.[c.id]}
								dispatch={this.props.dispatch}
								inputState={this.state}
								toggleAccordionCard={this.toggleAccordionCard}
							>
								<span>{React.cloneElement(c.bodyComponent, c.bodyComponentProps)}</span>
							</AccordionCard>
						))}
					</div>
				</div>
			</div>
		);
	}
}

Accordion.propTypes = {
	accordionId: PropTypes.string.isRequired, // every accordion must have a unique identifier
	cards: PropTypes.array.isRequired, // list of card data, each driving a single card in the accordion
	statuses: PropTypes.object, // each card has an associated status which is displayed/manipulated on the card header
	message: PropTypes.string, // text displayed to the left of the open/close all and add buttons at the top of the accordion
	expandAllToggle: PropTypes.bool, // this darn thing still doesn't work right!!
	onClickPlus: PropTypes.func, // accordion add button handler. If not defined, the add button won't be displayed
	newCardData: PropTypes.object, // new cards use this object to process with their form
};

// this is more for documentation purposes...
Accordion.defaultProps = {
	cards: [
		{
			id: 'card-id-not-displayed',
			header: 'card header',
			bodyComponent: (<></>),		// component to render the body of the card
			bodyComponentProps: {},
		}
	],
	expandAllToggle: true,
};

const statusesExample = {
	__cardId__: {
		badgeText: 'badge text',	// any string
		badgeStatus: 'bootstrap status color',	// dark, info, warning, success, danger, ...
	}
};

export default Accordion;
