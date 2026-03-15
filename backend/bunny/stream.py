"""
Utility functions for Bunny Stream API.

Bunny Stream is a dedicated video hosting and transcoding service.
Videos uploaded here get an embed player URL like:
  https://iframe.mediadelivery.net/embed/{library_id}/{video_id}

Configure in settings.py:
    BUNNY_STREAM_LIBRARY_ID = '123456'
    BUNNY_STREAM_API_KEY = 'your-api-key'
"""
import requests
from django.conf import settings


BUNNY_STREAM_BASE_URL = "https://video.bunnycdn.com/library"


def _get_headers():
    return {
        'AccessKey': getattr(settings, 'BUNNY_STREAM_API_KEY', ''),
        'Content-Type': 'application/json',
    }


def get_library_id():
    return getattr(settings, 'BUNNY_STREAM_LIBRARY_ID', '')


def create_video(title):
    """
    Create a new video entry on Bunny Stream and return the video ID.
    This is a two-step process: create → upload binary.
    """
    library_id = get_library_id()
    url = f"{BUNNY_STREAM_BASE_URL}/{library_id}/videos"
    payload = {'title': title}

    response = requests.post(url, json=payload, headers=_get_headers(), timeout=30)
    response.raise_for_status()
    data = response.json()
    return data.get('guid')


def upload_video_binary(video_id, file_obj):
    """
    Upload the actual video binary to an existing Bunny Stream video entry.
    file_obj should be a Django InMemoryUploadedFile or similar file-like object.
    """
    library_id = get_library_id()
    url = f"{BUNNY_STREAM_BASE_URL}/{library_id}/videos/{video_id}"

    upload_headers = {
        'AccessKey': getattr(settings, 'BUNNY_STREAM_API_KEY', ''),
        'Content-Type': 'application/octet-stream',
    }

    response = requests.put(
        url,
        data=file_obj.read(),
        headers=upload_headers,
        timeout=300,  # Large videos may take time
    )
    response.raise_for_status()
    return True


def upload_video(title, file_obj):
    """
    High-level function: create video on Bunny Stream and upload the binary.

    Returns a dict with:
      - video_id: str (Bunny Stream GUID)
      - embed_url: str (iframe embed URL for the frontend player)
    
    Raises requests.HTTPError on failure.
    """
    video_id = create_video(title)
    upload_video_binary(video_id, file_obj)

    library_id = get_library_id()
    embed_url = f"https://iframe.mediadelivery.net/embed/{library_id}/{video_id}"

    return {
        'video_id': video_id,
        'embed_url': embed_url,
    }


def delete_video(video_id):
    """
    Delete a video from Bunny Stream library.
    Best-effort: silently swallows errors.
    """
    library_id = get_library_id()
    url = f"{BUNNY_STREAM_BASE_URL}/{library_id}/videos/{video_id}"
    try:
        requests.delete(url, headers=_get_headers(), timeout=30)
    except requests.RequestException:
        pass


def get_embed_url(video_id):
    """Generate the embed iframe URL for a given video ID."""
    library_id = get_library_id()
    return f"https://iframe.mediadelivery.net/embed/{library_id}/{video_id}"
