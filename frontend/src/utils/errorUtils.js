/**
 * Error utility to transform technical errors into user-friendly messages.
 * Focuses on clarity, simplicity, and helpfulness.
 */

export const getFriendlyErrorMessage = (error) => {
    // Network Connectivity Issues
    if (!navigator.onLine) {
        return "You seem to be offline. Please check your internet connection.";
    }

    // Network Errors (Server unreachable, DNS issues, blocked requests)
    if (error.code === 'ERR_NETWORK') {
        return "We couldn't reach the server. Please check your internet connection.";
    }

    // Requests Timeouts
    if (error.code === 'ECONNABORTED') {
        return "The request took too long. Please try again.";
    }

    // Response Errors (Server returned an error status)
    if (error.response) {
        const { status, data } = error.response;

        // Use server-provided message if it exists and looks like a human-readable string
        // We avoid using it if it looks like a technical error code or object dump
        if (data?.message && typeof data.message === 'string' && data.message.length < 100 && !data.message.includes('Error:')) {
            return data.message;
        }

        switch (status) {
            case 400:
                return "Something's not quite right with that request. Please check and try again.";
            case 401:
                return "Please sign in to continue.";
            case 403:
                return "You don't have permission to do that.";
            case 404:
                return "We couldn't find what you were looking for.";
            case 409:
                return "This already exists. Please try a different one.";
            case 422:
                // Validation error - usually form fields where we want specific feedback, 
                // but as a fallback:
                return "Please check the information you entered.";
            case 429:
                return "You're doing that a bit too fast. Please wait a moment.";
            case 500:
                return "Something went wrong on our end. We're fixing it!";
            case 502:
            case 503:
            case 504:
                return "Our services are currently unavailable. Please try again soon.";
            default:
                return "An unexpected error occurred. Please try again.";
        }
    }

    // Fallback for everything else
    return "Something didn't go as planned. Please try again.";
};
