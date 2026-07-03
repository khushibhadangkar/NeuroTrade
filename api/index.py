import sys
from pathlib import Path

# Resolve path to the backend directory
_API_DIR = Path(__file__).resolve().parent
_REPO_ROOT = _API_DIR.parent / "backend"

# Add backend and backend/api to sys.path so imports resolve
for _path in (str(_REPO_ROOT), str(_REPO_ROOT / "api")):
    if _path not in sys.path:
        sys.path.insert(0, _path)

from app import app

class PrefixMiddleware(object):
    """
    WSGI middleware to strip '/api/backend' from the request paths
    before Flask routing maps them.
    """
    def __init__(self, wsgi_app, prefix=''):
        self.wsgi_app = wsgi_app
        self.prefix = prefix

    def __call__(self, environ, start_response):
        if environ['PATH_INFO'].startswith(self.prefix):
            environ['PATH_INFO'] = environ['PATH_INFO'][len(self.prefix):]
            environ['SCRIPT_NAME'] = self.prefix
        return self.wsgi_app(environ, start_response)

# Apply prefix stripping middleware
app.wsgi_app = PrefixMiddleware(app.wsgi_app, prefix='/api/backend')
