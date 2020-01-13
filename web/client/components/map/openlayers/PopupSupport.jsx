/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */
import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { Overlay } from 'ol';
import {isEqual} from 'lodash';

export default class PopupSupport extends React.Component {

    static propTypes = {
        map: PropTypes.object,
        popups: PropTypes.arrayOf(PropTypes.object),
        onPopupClose: PropTypes.func
    }

    static defaultProps = {
        popups: [],
        onPopupClose: () => {}
    }

    constructor(props) {
        super(props);
        this.preparePopups(props.popups, props.map);
    }

    state = {
        popups: []
    }

    componentDidMount() {
        const { popups, map } = this.props;
        this.preparePopups(popups, map);
    }

    UNSAFE_componentWillUpdate(nextProps) {
        const newPopups = nextProps.popups.map(({id, position}) => ({id, position}));
        const currentPopups = this.props.popups.map(({id, position}) => ({id, position}));
        if (!isEqual(currentPopups, newPopups)) {
            this.preparePopups(nextProps.popups, nextProps.map);
        }
    }

    onPopupClose = (id) => {
        this.state.popups.map(p => {
            if (p.getId() === id) p.setPosition(undefined, undefined);
        });
        this.props.onPopupClose(id);
    }

    renderPopups() {
        const { popups } = this.props;
        return popups.map(({ id, content: PopupContent }) => {
            return ReactDOM.createPortal(
                <div className="map-popup-ol" key={id} onMouseUp={this.convertToClick}>
                    <div>
                        <div className="ol-popup-closer" onClick={() => this.onPopupClose(id)}></div>
                        <PopupContent showInMapPopup />
                    </div>
                </div>,
                document.getElementById(id)
            );
        });
    }

    render() {
        return <div className="popup-wrapper">{this.renderPopups()}</div>;
    }

    convertToClick = (e) => {
        const evt = new MouseEvent('click', { bubbles: true });
        evt.stopPropagation = () => {};
        e.target.dispatchEvent(evt);
    }

    preparePopups = (popups, map) => {
        let overlays = [];
        popups.map(({ id, position: { coordinates } }) => {
            const element = document.createElement('div');
            element.id = id;
            const overlay = new Overlay({
                id,
                element,
                autoPan: true,
                autoPanAnimation: {
                    duration: 200
                },
                positioning: 'bottom-center',
                className: 'ol-overlay-container ol-unselectable'
            });

            map.addOverlay(overlay);
            overlay.setPosition(coordinates);
            overlays.push(overlay);
        });
        this.setState({ popups: overlays });
    }
}
