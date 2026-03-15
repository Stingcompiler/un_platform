"""
Custom Django Storage Backend for Bunny.net Storage (BunnyCDN)

Files are uploaded to the Bunny Storage REST API and served via a CDN pull zone.
Configure in settings.py:
    DEFAULT_FILE_STORAGE = 'bunny.storage.BunnyStorage'
    BUNNY_STORAGE_ZONE = 'your-zone-name'
    BUNNY_STORAGE_PASSWORD = 'your-api-password'
    BUNNY_STORAGE_REGION = 'de'   # de, ny, la, sg, syd, br, jh
    BUNNY_CDN_HOSTNAME = 'yourzone.b-cdn.net'
"""
import os
import uuid
import mimetypes
import requests
from django.conf import settings
from django.core.files.storage import Storage


REGION_HOSTNAMES = {
    'de': 'storage.bunnycdn.com',
    'ny': 'ny.storage.bunnycdn.com',
    'la': 'la.storage.bunnycdn.com',
    'sg': 'sg.storage.bunnycdn.com',
    'syd': 'syd.storage.bunnycdn.com',
    'br': 'br.storage.bunnycdn.com',
    'jh': 'jh.storage.bunnycdn.com',
}


class BunnyStorage(Storage):
    """
    Django storage backend that saves files to Bunny.net Storage.
    Requires the following Django settings:
      - BUNNY_STORAGE_ZONE
      - BUNNY_STORAGE_PASSWORD
      - BUNNY_STORAGE_REGION (default: 'de')
      - BUNNY_CDN_HOSTNAME
    """

    def __init__(self):
        self.zone = getattr(settings, 'BUNNY_STORAGE_ZONE', '')
        self.password = getattr(settings, 'BUNNY_STORAGE_PASSWORD', '')
        self.region = getattr(settings, 'BUNNY_STORAGE_REGION', 'de')
        self.cdn_hostname = getattr(settings, 'BUNNY_CDN_HOSTNAME', '')
        self.base_api_url = f"https://{REGION_HOSTNAMES.get(self.region, 'storage.bunnycdn.com')}/{self.zone}"

    def _get_headers(self, content_type=None):
        headers = {
            'AccessKey': self.password,
        }
        if content_type:
            headers['Content-Type'] = content_type
        return headers

    def _save(self, name, content):
        """Upload file to Bunny Storage and return the stored name."""
        # Ensure unique name to avoid collisions
        ext = os.path.splitext(name)[1]
        base = os.path.splitext(name)[0]
        unique_name = f"{base}_{uuid.uuid4().hex[:8]}{ext}"

        upload_url = f"{self.base_api_url}/{unique_name}"
        content_type, _ = mimetypes.guess_type(name)
        content_type = content_type or 'application/octet-stream'

        # Reset file position — Django may have read it already for validation
        if hasattr(content, 'seek'):
            content.seek(0)
        file_data = content.read()

        response = requests.put(
            upload_url,
            data=file_data,
            headers=self._get_headers(content_type=content_type),
            timeout=120,
        )
        response.raise_for_status()
        # Consume response body to allow connection reuse
        _ = response.content
        return unique_name

    def url(self, name):
        """Return public CDN URL for the file."""
        if not name:
            return ''
        return f"https://{self.cdn_hostname}/{name}"

    def exists(self, name):
        """Check if file exists on Bunny Storage."""
        check_url = f"{self.base_api_url}/{name}"
        try:
            response = requests.get(
                check_url,
                headers=self._get_headers(),
                timeout=10,
            )
            return response.status_code == 200
        except requests.RequestException:
            return False

    def delete(self, name):
        """Delete file from Bunny Storage."""
        delete_url = f"{self.base_api_url}/{name}"
        try:
            requests.delete(
                delete_url,
                headers=self._get_headers(),
                timeout=10,
            )
        except requests.RequestException:
            pass  # Best effort delete

    def size(self, name):
        """Return file size via HEAD request."""
        check_url = f"{self.base_api_url}/{name}"
        try:
            response = requests.head(
                check_url,
                headers=self._get_headers(),
                timeout=10,
            )
            if response.status_code == 200:
                return int(response.headers.get('Content-Length', 0))
        except requests.RequestException:
            pass
        return 0

    def path(self, name):
        """BunnyStorage does not support local file path access."""
        raise NotImplementedError("BunnyStorage does not support local file paths.")

    def get_available_name(self, name, max_length=None):
        """Always return the name; uniqueness is handled in _save via UUID suffix."""
        return name
