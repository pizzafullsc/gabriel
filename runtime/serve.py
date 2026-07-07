import http.server
import os
import socket
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PORT_FILE = ROOT / 'runtime' / 'port.txt'
HOST_FILE = ROOT / 'runtime' / 'host.txt'


def find_open_port(start=8000, end=8100):
    for port in range(start, end + 1):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                sock.bind(('0.0.0.0', port))
                return port
            except OSError:
                continue
    raise RuntimeError('No free port available')


def get_lan_ip():
    try:
        host = socket.gethostname()
        infos = socket.getaddrinfo(host, None, socket.AF_INET, socket.SOCK_DGRAM)
        for info in infos:
            ip = info[4][0]
            if ip and not ip.startswith('127.') and not ip.startswith('169.254.'):
                return ip
    except Exception:
        pass
    return '127.0.0.1'


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, format, *args):
        return

    def translate_path(self, path):
        path = path.split('?', 1)[0].split('#', 1)[0]
        if path in ('', '/'):
            path = '/launcher.html'
        return super().translate_path(path)


def main():
    port = find_open_port()
    host = get_lan_ip()
    PORT_FILE.write_text(str(port), encoding='utf-8')
    HOST_FILE.write_text(host, encoding='utf-8')

    server = http.server.ThreadingHTTPServer(('0.0.0.0', port), Handler)
    server.serve_forever()


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(0)
    except Exception as exc:
        print(str(exc))
        sys.exit(1)
