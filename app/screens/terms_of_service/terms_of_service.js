// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {
    Alert,
    Animated,
    InteractionManager,
    Platform,
    ScrollView,
    Text,
    View,
} from 'react-native';
import {intlShape} from 'react-intl';
import IonIcon from 'react-native-vector-icons/Ionicons';

import {getTermsOfService, updateTermsOfServiceStatus} from 'app/actions/views/terms_of_service';

import Loading from 'app/components/loading';
import Markdown from 'app/components/markdown';
import StatusBar from 'app/components/status_bar';

import {ViewTypes} from 'app/constants';

import {getMarkdownTextStyles, getMarkdownBlockStyles} from 'app/utils/markdown';
import {changeOpacity, makeStyleSheetFromTheme, setNavigatorStyles} from 'app/utils/theme';

const HEIGHT = 38;
const {
    ANDROID_TOP_LANDSCAPE,
    ANDROID_TOP_PORTRAIT,
    IOS_TOP_LANDSCAPE,
    IOS_TOP_PORTRAIT,
    IOSX_TOP_PORTRAIT,
    STATUS_BAR_HEIGHT,
} = ViewTypes;

export default class TermsOfService extends PureComponent {
    static propTypes = {
        actions: PropTypes.shape({
            logout: PropTypes.func.isRequired,
        }),
        closeButton: PropTypes.object,
        isLandscape: PropTypes.bool,
        navigator: PropTypes.object,
        siteName: PropTypes.string,
        termsEnabled: PropTypes.bool,
        theme: PropTypes.object,
    };

    static contextTypes = {
        intl: intlShape,
    };

    static defaultProps = {
        siteName: 'Mattermost',
        termsEnabled: true,
    };

    leftButton = {
        id: 'close-terms-of-service',
    };

    rightButton = {
        id: 'accept-terms-of-service',
        showAsAction: 'always',
    };

    constructor(props, context) {
        super(props);
        const navBar = this.getNavBarHeight(props.isLandscape);

        this.state = {
            error: null,
            loading: true,
            serverError: null,
            termsId: '',
            termsText: '',
            top: new Animated.Value(navBar - HEIGHT),
        };

        this.rightButton.title = context.intl.formatMessage({id: 'terms_of_service.agreeButton', defaultMessage: 'I Agree'});
        this.leftButton.icon = props.closeButton;

        props.navigator.setOnNavigatorEvent(this.onNavigatorEvent);
        this.setNavigatorButtons();
    }

    componentDidMount() {
        this.getTerms();
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.theme !== nextProps.theme) {
            setNavigatorStyles(this.props.navigator, nextProps.theme);
        }

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

    setNavigatorButtons = (enabled = true) => {
        const buttons = {
            leftButtons: [{...this.leftButton, disabled: !enabled}],
            rightButtons: [{...this.rightButton, disabled: !enabled}],
        };

        this.props.navigator.setButtons(buttons);
    };

    getTerms = () => {
        this.setState({
            termsId: '',
            termsText: '',
            loading: true,
        });
        getTermsOfService(
            (data) => {
                this.setState({
                    termsId: data.id,
                    termsText: data.text,
                    loading: false,
                });
            },
            (err) => {
                // TODO: Handle this
                this.setState({
                    loading: false,
                }, () => {
                    Alert.alert('', err.message);
                });
            }
        );
    };

    handleAcceptTerms = () => {
        this.setNavigatorButtons(false);
        this.registerUserAction(
            true,
            () => {
                this.setNavigatorButtons(true);
                this.props.navigator.dismissModal({
                    animationType: 'slide-down',
                });
            }
        );
    };

    handleRejectTerms = () => {
        const {logout} = this.props.actions;
        this.setNavigatorButtons(false);
        this.registerUserAction(
            false,
            () => {
                this.setNavigatorButtons(true);
                this.props.navigator.dismissAllModals();
                InteractionManager.runAfterInteractions(logout);
            }
        );
    };

    registerUserAction = (accepted, success) => {
        this.setState({
            loading: true,
        });
        updateTermsOfServiceStatus(
            this.state.termsId,
            accepted,
            success,
            () => {
                this.setNavigatorButtons(true);
                this.setState({
                    loading: false,
                });
                // TODO: Show Error
            },
        );
    };

    onNavigatorEvent = (event) => {
        if (event.type === 'NavBarButtonPress') {
            switch (event.id) {
            case 'close-terms-of-service':
                this.handleRejectTerms();
                break;

            case 'accept-terms-of-service':
                this.handleAcceptTerms();
                break;
            }
        }
    };

    render() {
        const {navigator, theme} = this.props;
        const styles = getStyleSheet(theme);

        const blockStyles = getMarkdownBlockStyles(theme);
        const textStyles = getMarkdownTextStyles(theme);

        if (this.state.loading) {
            return <Loading/>;
        }

        const background = this.backgroundColor.interpolate({
            inputRange: [0, 1],
            outputRange: ['#939393', '#629a41'],
        });

        return (
            <React.Fragment>
                <Animated.View style={[styles.container, {top: 0, backgroundColor: background}]}>
                    <Animated.View style={styles.wrapper}>
                        <Text>{'Hello World'}</Text>
                        <View style={styles.actionContainer}>
                            <IonIcon
                                color='#FFFFFF'
                                name='md-checkmark'
                                size={20}
                            />
                        </View>
                    </Animated.View>
                </Animated.View>
                <StatusBar/>
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollViewContent}
                >
                    <Markdown
                        baseTextStyle={styles.baseText}
                        navigator={navigator}
                        textStyles={textStyles}
                        blockStyles={blockStyles}
                        value={(this.state.termsText || '')}
                    />
                </ScrollView>
            </React.Fragment>
        );
    }
}

const getStyleSheet = makeStyleSheetFromTheme((theme) => {
    return {
        baseText: {
            color: theme.centerChannelColor,
            fontSize: 15,
            lineHeight: 20,
            opacity: 0.6,
        },
        linkText: {
            color: theme.linkColor,
            opacity: 0.8,
        },
        scrollView: {
            flex: 1,
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.03),
            padding: 30,
        },
        scrollViewContent: {
            paddingBottom: 50,
        },


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
    };
});
