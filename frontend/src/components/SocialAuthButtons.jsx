import { useState } from 'react';

/**
 * SocialAuthButtons Component
 * Provides Google and Apple Sign-In buttons with beautiful, responsive design
 * Optimized for mobile, tablet, and desktop screens
 */
const SocialAuthButtons = ({ onGoogleSuccess, onAppleSuccess, onError, loading: externalLoading, mode = 'signin' }) => {
    const [googleLoading, setGoogleLoading] = useState(false);
    const [appleLoading, setAppleLoading] = useState(false);

    const isLoading = externalLoading || googleLoading || appleLoading;

    // Google Sign-In Handler
    const handleGoogleSignIn = async () => {
        setGoogleLoading(true);
        try {
            // Check if Google SDK is loaded
            if (typeof google === 'undefined' || !google.accounts) {
                onError?.('Google Sign-In is not configured yet. This feature will be available soon!');
                setGoogleLoading(false);
                return;
            }

            // Initialize Google Sign-In
            const client = google.accounts.oauth2.initTokenClient({
                client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
                scope: 'email profile',
                callback: async (response) => {
                    if (response.error) {
                        onError?.(response.error_description || 'Google sign-in failed');
                        setGoogleLoading(false);
                        return;
                    }

                    try {
                        // Fetch user info with the access token
                        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                            headers: { Authorization: `Bearer ${response.access_token}` }
                        });
                        const userData = await userInfoResponse.json();

                        // Call the success handler with user data
                        await onGoogleSuccess?.({
                            sub: userData.sub,
                            email: userData.email,
                            name: userData.name,
                            given_name: userData.given_name,
                            family_name: userData.family_name,
                            picture: userData.picture
                        });
                    } catch (err) {
                        onError?.(err.message || 'Failed to get user information');
                    } finally {
                        setGoogleLoading(false);
                    }
                },
            });

            client.requestAccessToken();
        } catch (err) {
            onError?.(err.message || 'Google sign-in failed');
            setGoogleLoading(false);
        }
    };

    // Apple Sign-In Handler
    const handleAppleSignIn = async () => {
        setAppleLoading(true);
        try {
            // Check if Apple SDK is loaded
            if (typeof AppleID === 'undefined') {
                onError?.('Apple Sign-In is not configured yet. This feature will be available soon!');
                setAppleLoading(false);
                return;
            }

            // Initialize Apple Sign-In
            AppleID.auth.init({
                clientId: import.meta.env.VITE_APPLE_CLIENT_ID,
                scope: 'name email',
                redirectURI: window.location.origin + '/auth/apple/callback',
                usePopup: true
            });

            const response = await AppleID.auth.signIn();

            // Extract user data from Apple response
            const userData = {
                sub: response.authorization?.id_token ?
                    JSON.parse(atob(response.authorization.id_token.split('.')[1])).sub : null,
                email: response.user?.email,
                name: response.user?.name ?
                    `${response.user.name.firstName || ''} ${response.user.name.lastName || ''}`.trim() : null,
                given_name: response.user?.name?.firstName,
                family_name: response.user?.name?.lastName
            };

            await onAppleSuccess?.(userData, response.authorization);
        } catch (err) {
            // Apple sign-in was cancelled by user
            if (err.error !== 'popup_closed_by_user') {
                onError?.(err.message || err.error || 'Apple sign-in failed');
            }
        } finally {
            setAppleLoading(false);
        }
    };

    const buttonText = mode === 'signup' ? 'Sign up' : 'Continue';

    // Google Icon SVG
    const GoogleIcon = () => (
        <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
        </svg>
    );

    // Apple Icon SVG
    const AppleIcon = () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
        </svg>
    );

    // Loading Spinner
    const Spinner = ({ light }) => (
        <div
            style={{
                width: '20px',
                height: '20px',
                border: `2px solid ${light ? 'rgba(255,255,255,0.3)' : '#e5e7eb'}`,
                borderTopColor: light ? '#ffffff' : '#6b7280',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                flexShrink: 0
            }}
        />
    );

    return (
        <div style={{ width: '100%', marginTop: '24px' }}>
            {/* CSS Animation for spinner */}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

            {/* Divider */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '24px'
            }}>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
                <span style={{ fontSize: '14px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                    {mode === 'signup' ? 'Or sign up with' : 'Or continue with'}
                </span>
                <div style={{ flex: 1, height: '1px', backgroundColor: '#e5e7eb' }} />
            </div>

            {/* Buttons Container */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
            }}>
                {/* Google Button */}
                <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        width: '100%',
                        padding: '14px 16px',
                        borderRadius: '12px',
                        fontSize: '15px',
                        fontWeight: '500',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        border: '1px solid #e5e7eb',
                        backgroundColor: '#ffffff',
                        color: '#374151',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                        minHeight: '52px',
                        opacity: isLoading ? 0.7 : 1
                    }}
                    onMouseOver={(e) => {
                        if (!isLoading) {
                            e.currentTarget.style.backgroundColor = '#f9fafb';
                            e.currentTarget.style.borderColor = '#d1d5db';
                            e.currentTarget.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.1)';
                        }
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#ffffff';
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.08)';
                    }}
                >
                    {googleLoading ? <Spinner /> : <GoogleIcon />}
                    <span style={{ flex: 1, textAlign: 'center' }}>
                        {googleLoading ? 'Signing in...' : `${buttonText} with Google`}
                    </span>
                </button>

                {/* Apple Button */}
                <button
                    type="button"
                    onClick={handleAppleSignIn}
                    disabled={isLoading}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        width: '100%',
                        padding: '14px 16px',
                        borderRadius: '12px',
                        fontSize: '15px',
                        fontWeight: '500',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        border: 'none',
                        backgroundColor: '#000000',
                        color: '#ffffff',
                        minHeight: '52px',
                        opacity: isLoading ? 0.7 : 1
                    }}
                    onMouseOver={(e) => {
                        if (!isLoading) {
                            e.currentTarget.style.backgroundColor = '#1a1a1a';
                        }
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = '#000000';
                    }}
                >
                    {appleLoading ? <Spinner light /> : <AppleIcon />}
                    <span style={{ flex: 1, textAlign: 'center' }}>
                        {appleLoading ? 'Signing in...' : `${buttonText} with Apple`}
                    </span>
                </button>
            </div>
        </div>
    );
};

export default SocialAuthButtons;
