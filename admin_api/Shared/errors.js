module.exports = {

    getCustomProperties(status, method, url, message, error, request) {
        return {
            'status': status,
            'method': method,
            'url': url,
            'message': message,
            'error': error,
            'request': request
        };
    }
 }
