#!/usr/bin/env python3
"""Upload a rendered MP4 to Google Drive (folder "Wisdom Scribe renders") and make it viewable by link,
so Canva can import it from https://drive.usercontent.google.com/download?id=<id>&export=download.

Needs env: GDRIVE_CLIENT_ID, GDRIVE_CLIENT_SECRET, GDRIVE_REFRESH_TOKEN (scope drive.file: this app only
sees files it created). Prints the file id and writes drive.json next to the video.
"""
import json, os, sys, urllib.parse, urllib.request
from pathlib import Path

FOLDER = os.environ.get('GDRIVE_FOLDER', 'Wisdom Scribe renders')
API = 'https://www.googleapis.com/drive/v3'


def call(method, url, token=None, data=None, headers=None, raw=False):
    h = dict(headers or {})
    if token:
        h['Authorization'] = 'Bearer ' + token
    if isinstance(data, dict):
        data = json.dumps(data).encode(); h.setdefault('Content-Type', 'application/json; charset=UTF-8')
    req = urllib.request.Request(url, data=data, method=method, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=600) as r:
            return r if raw else json.loads(r.read() or b'{}')
    except urllib.error.HTTPError as e:
        sys.exit(f'Drive error {e.code} on {method} {url.split("?")[0]}: {e.read().decode()[:400]}')


def access_token():
    body = urllib.parse.urlencode({'client_id': os.environ['GDRIVE_CLIENT_ID'], 'client_secret': os.environ['GDRIVE_CLIENT_SECRET'],
                                   'refresh_token': os.environ['GDRIVE_REFRESH_TOKEN'], 'grant_type': 'refresh_token'}).encode()
    return call('POST', 'https://oauth2.googleapis.com/token', data=body, headers={'Content-Type': 'application/x-www-form-urlencoded'})['access_token']


def folder_id(tok):
    q = urllib.parse.quote(f"name = '{FOLDER}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false")
    found = call('GET', f'{API}/files?q={q}&fields=files(id)', tok).get('files', [])
    if found:
        return found[0]['id']
    return call('POST', f'{API}/files?fields=id', tok, {'name': FOLDER, 'mimeType': 'application/vnd.google-apps.folder'})['id']


def main(path):
    path = Path(path); tok = access_token(); parent = folder_id(tok)
    # replace an older render of the same video
    q = urllib.parse.quote(f"name = '{path.name}' and '{parent}' in parents and trashed = false")
    for f in call('GET', f'{API}/files?q={q}&fields=files(id)', tok).get('files', []):
        call('DELETE', f"{API}/files/{f['id']}", tok, raw=True)
    size = path.stat().st_size
    r = call('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id', tok,
             {'name': path.name, 'parents': [parent], 'mimeType': 'video/mp4'},
             headers={'X-Upload-Content-Type': 'video/mp4', 'X-Upload-Content-Length': str(size)}, raw=True)
    session = r.headers['Location']
    with open(path, 'rb') as fh:
        res = call('PUT', session, data=fh.read(), headers={'Content-Type': 'video/mp4', 'Content-Length': str(size)})
    fid = res['id']
    call('POST', f'{API}/files/{fid}/permissions', tok, {'type': 'anyone', 'role': 'reader'})
    info = {'id': fid, 'name': path.name, 'size': size,
            'canva_url': f'https://drive.usercontent.google.com/download?id={fid}&export=download'}
    path.with_suffix('.drive.json').write_text(json.dumps(info, indent=2))
    print(json.dumps(info))


if __name__ == '__main__':
    main(sys.argv[1])
