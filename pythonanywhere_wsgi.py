import sys
import os
import asyncio
from io import BytesIO

# Add project directory to path
project_home = '/home/bareeqalyusr/bareq-alyusr--3.0-'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Change to project directory
os.chdir(project_home)

# Set environment variables before importing anything
os.environ.setdefault('DATABASE_URL', 'sqlite:///./bareq_alyusr.db')

# Initialize database FIRST (synchronous operation)
from app.database import init_db
init_db()

# Import FastAPI app
from app.main import app as fastapi_app


class ASGItoWSGI:
    """
    Custom ASGI to WSGI adapter that properly handles async operations.
    Creates a fresh event loop for each request to avoid blocking issues.
    """
    
    def __init__(self, asgi_app):
        self.asgi_app = asgi_app
    
    def __call__(self, environ, start_response):
        # Create a fresh event loop for this request
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            # Build ASGI scope
            scope = self._build_scope(environ)
            
            # Read request body
            content_length = int(environ.get('CONTENT_LENGTH') or 0)
            body = environ['wsgi.input'].read(content_length) if content_length > 0 else b''
            
            # Response storage
            status_code = 500
            response_headers = []
            body_parts = []
            
            async def receive():
                return {
                    'type': 'http.request',
                    'body': body,
                    'more_body': False
                }
            
            async def send(message):
                nonlocal status_code, response_headers
                if message['type'] == 'http.response.start':
                    status_code = message['status']
                    response_headers = [
                        (k.decode('utf-8') if isinstance(k, bytes) else k,
                         v.decode('utf-8') if isinstance(v, bytes) else v)
                        for k, v in message.get('headers', [])
                    ]
                elif message['type'] == 'http.response.body':
                    body_parts.append(message.get('body', b''))
            
            # Run the ASGI app with a timeout
            async def run_with_timeout():
                try:
                    await asyncio.wait_for(
                        self.asgi_app(scope, receive, send),
                        timeout=60.0  # 60 second timeout
                    )
                except asyncio.TimeoutError:
                    nonlocal status_code, response_headers, body_parts
                    status_code = 504
                    response_headers = [('Content-Type', 'text/plain')]
                    body_parts = [b'Gateway Timeout']
            
            loop.run_until_complete(run_with_timeout())
            
            # Build status line
            status_phrases = {
                200: 'OK', 201: 'Created', 204: 'No Content',
                301: 'Moved Permanently', 302: 'Found', 304: 'Not Modified',
                400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden',
                404: 'Not Found', 405: 'Method Not Allowed', 422: 'Unprocessable Entity',
                500: 'Internal Server Error', 502: 'Bad Gateway', 503: 'Service Unavailable',
                504: 'Gateway Timeout'
            }
            status_line = f"{status_code} {status_phrases.get(status_code, 'Unknown')}"
            
            start_response(status_line, response_headers)
            return [b''.join(body_parts)]
            
        except Exception as e:
            # Return error response
            error_body = f'Internal Server Error: {str(e)}'.encode('utf-8')
            start_response('500 Internal Server Error', [
                ('Content-Type', 'text/plain'),
                ('Content-Length', str(len(error_body)))
            ])
            return [error_body]
        finally:
            # Clean up the event loop
            try:
                loop.run_until_complete(loop.shutdown_asyncgens())
            except:
                pass
            loop.close()
    
    def _build_scope(self, environ):
        """Build ASGI scope from WSGI environ."""
        # Parse headers
        headers = []
        for key, value in environ.items():
            if key.startswith('HTTP_'):
                header_name = key[5:].replace('_', '-').lower()
                headers.append((header_name.encode('utf-8'), value.encode('utf-8')))
            elif key == 'CONTENT_TYPE' and value:
                headers.append((b'content-type', value.encode('utf-8')))
            elif key == 'CONTENT_LENGTH' and value:
                headers.append((b'content-length', value.encode('utf-8')))
        
        # Get server info
        server_name = environ.get('SERVER_NAME', 'localhost')
        server_port = environ.get('SERVER_PORT', '80')
        try:
            server_port = int(server_port)
        except (ValueError, TypeError):
            server_port = 80
        
        return {
            'type': 'http',
            'asgi': {'version': '3.0', 'spec_version': '2.3'},
            'http_version': environ.get('SERVER_PROTOCOL', 'HTTP/1.1').split('/')[-1],
            'method': environ['REQUEST_METHOD'],
            'scheme': environ.get('wsgi.url_scheme', 'https'),
            'path': environ.get('PATH_INFO', '/'),
            'raw_path': environ.get('PATH_INFO', '/').encode('utf-8'),
            'query_string': environ.get('QUERY_STRING', '').encode('utf-8'),
            'root_path': environ.get('SCRIPT_NAME', ''),
            'headers': headers,
            'server': (server_name, server_port),
            'client': (environ.get('REMOTE_ADDR', ''), 0),
        }


# Create WSGI application
application = ASGItoWSGI(fastapi_app)