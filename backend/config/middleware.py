class KeepPostSlashMiddleware:
    """
    Rewrite a missing trailing slash onto the request path.

    Production nginx answers a slashed POST with 308 to the slashless URL.
    Django then redirects back to the slashed URL and the browser turns the
    POST into a GET, so hide/create calls fail. Adding the slash here keeps
    the original method and body.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path_info
        if request.method not in ("GET", "HEAD", "OPTIONS", "TRACE") and path and not path.endswith("/"):
            request.path_info = f"{path}/"
            request.path = f"{request.path}/"
        return self.get_response(request)
