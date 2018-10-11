// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {
    Alert,
    InteractionManager,
    ScrollView,
} from 'react-native';
import {intlShape} from 'react-intl';
import AnnouncementBanner from 'app/components/announcement_banner';

import {getTermsOfService, updateTermsOfServiceStatus} from 'app/actions/views/terms_of_service';

import FormattedText from 'app/components/formatted_text';
import Loading from 'app/components/loading';
import Markdown from 'app/components/markdown';
import StatusBar from 'app/components/status_bar';
import {getMarkdownTextStyles, getMarkdownBlockStyles} from 'app/utils/markdown';
import {changeOpacity, makeStyleSheetFromTheme, setNavigatorStyles} from 'app/utils/theme';

export default class TermsOfService extends PureComponent {
    static propTypes = {
        actions: PropTypes.shape({
            logout: PropTypes.func.isRequired,
        }),
        closeButton: PropTypes.object,
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

        this.state = {
            error: null,
            loading: true,
            serverError: null,
            termsId: '',
            termsText: '',
        };

        this.rightButton.title = context.intl.formatMessage({id: 'terms_of_service.agreeButton', defaultMessage: 'I Agree'});
        this.leftButton.icon = props.closeButton;
        this.backgroundColor = new Animated.Value(0);

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
    }

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
                <AnnouncementBanner navigator={navigator} theme={theme} bannerColor={'red'} bannerText={'Hello World'}/>
                <StatusBar/>

                <FormattedText
                    defaultMessage={'Unable to complete the request. If this issue persists, contact your System Administrator.'}
                    id={'terms_of_service.api_error'}
                    style={styles.message}
                />
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
    };
});
