// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {
    Animated,
    Platform,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import {intlShape} from 'react-intl'
import IonIcon from 'react-native-vector-icons/Ionicons';

import {ViewTypes} from 'app/constants';

const HEIGHT = 38;
const {
    ANDROID_TOP_LANDSCAPE,
    ANDROID_TOP_PORTRAIT,
    IOS_TOP_LANDSCAPE,
    IOS_TOP_PORTRAIT,
    IOSX_TOP_PORTRAIT,
    STATUS_BAR_HEIGHT,
} = ViewTypes;

export default class ErrorBanner extends PureComponent {
    static propTypes = {
        onClose: PropTypes.func,
        isLandscape: PropTypes.bool,
        navigator: PropTypes.object.isRequired,
        theme: PropTypes.object.isRequired,
    };

    static contextTypes = {
        intl: intlShape,
    };

    constructor(props) {
        super(props);
        const navBar = this.getNavBarHeight(props.isLandscape);
        this.state = {
            top: new Animated.Value(navBar - HEIGHT),
        };
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.isLandscape !== this.props.isLandscape) {
            const navBar = this.getNavBarHeight(nextProps.isLandscape);
            const top = new Animated.Value(navBar - HEIGHT);
            this.setLocalState({navBar, top});
        }
    }

    getNavBarHeight = (isLandscape) => {
        if (Platform.OS === 'android') {
            if (isLandscape) {
                return ANDROID_TOP_LANDSCAPE;
            }

            return ANDROID_TOP_PORTRAIT;
        }

        if (this.isX && isLandscape) {
            return IOS_TOP_LANDSCAPE;
        } else if (this.isX) {
            return IOSX_TOP_PORTRAIT;
        } else if (isLandscape) {
            return IOS_TOP_LANDSCAPE + STATUS_BAR_HEIGHT;
        }

        return IOS_TOP_PORTRAIT;
    };

    render() {
        if (!this.props.visible) {
            return null;
        }

        const {top, backgroundColor} = this.props;

        return (
            <Animated.View style={[styles.container, {top, backgroundColor}]}>
                <Animated.View style={styles.wrapper}>
                    <TouchableOpacity style={styles.actionContainer} onPress={this.props.onClose}>
                        <IonIcon
                            color='#FFFFFF'
                            name='md-close'
                            size={20}
                        />
                    </TouchableOpacity>
                </Animated.View>
            </Animated.View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        height: HEIGHT,
        width: '100%',
        zIndex: 9,
        position: 'absolute',
    },
    wrapper: {
        alignItems: 'center',
        flex: 1,
        height: HEIGHT,
        flexDirection: 'row',
        paddingLeft: 12,
        paddingRight: 5,
    },
    message: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
    actionButton: {
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FFFFFF',
    },
    actionContainer: {
        alignItems: 'flex-end',
        height: 24,
        justifyContent: 'center',
        paddingRight: 10,
        width: 60,
    },
});
