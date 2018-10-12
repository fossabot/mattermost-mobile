// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {
    Animated,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
} from 'react-native';
import {intlShape} from 'react-intl';
import IonIcon from 'react-native-vector-icons/Ionicons';
import DeviceInfo from 'react-native-device-info/deviceinfo';

import {ViewTypes} from 'app/constants';

// const HEIGHT = 38;
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
        dismissible: PropTypes.bool,
        isLandscape: PropTypes.bool,
        text: PropTypes.string,
        theme: PropTypes.object.isRequired,
    };

    static contextTypes = {
        intl: intlShape,
    };

    static defaultProps = {
        backgroundColor: this.backgroundColor.interpolate({
            inputRange: [0, 1],
            outputRange: ['#939393', '#629a41'],
        }),
        dismissible: true,
        textColor: '#FFFFFF',
    };

    constructor(props) {
        super(props);
        this.backgroundColor = new Animated.Value(0);
        this.isX = DeviceInfo.getModel().includes('iPhone X');
        const navBar = this.getNavBarHeight(props.isLandscape);
        this.state = {
            height: new Animated.Value(navBar),
        };
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.isLandscape !== this.props.isLandscape) {
            const navBar = this.getNavBarHeight(nextProps.isLandscape);
            this.setState({
                height: new Animated.Value(navBar),
            });
        }

        if (nextProps.visible && !this.props.visible) {

        }
    }
    componentDidUpdate(prevProps) {
        if (this.props.isLandscape !== prevProps.isLandscape) {
            const navBar = this.getNavBarHeight(this.props.isLandscape);
            this.setState({
                height: new Animated.Value(navBar),
            });
        }
        if (!prevProps.visible && this.props.visible) {
            this.show();
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

    show = () => {
        Animated.timing(
            this.state.top, {
                toValue: this.state.navBar,
                duration: 300,
            }
        ).start();
    };

    render() {
        if (!this.props.visible) {
            return null;
        }

        const {backgroundColor, dismissible, text, textColor} = this.props;
        const {height} = this.state;

        return (
            <Animated.View style={[styles.container, {backgroundColor, height}]}>
                <Animated.View style={styles.wrapper}>
                    <Text style={[styles.message, {color: textColor}]}>{text}</Text>
                    {
                        dismissible && <TouchableOpacity
                            style={styles.actionContainer}
                            onPress={this.props.onClose}
                        >
                            <IonIcon
                                color='#FFFFFF'
                                name='md-close'
                                size={20}
                            />
                        </TouchableOpacity>
                    }
                </Animated.View>
            </Animated.View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        height: HEIGHT,
        overflow: 'hidden',
        width: '100%',
        zIndex: 9,
        position: 'absolute',
        top: 0,
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
