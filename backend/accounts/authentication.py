from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.conf import settings


class CookieJWTAuthentication(JWTAuthentication):
    """
    Custom JWT Authentication that reads tokens from HttpOnly cookies
    """
    
    def authenticate(self, request):
        # Try to get token from cookie first
        raw_token = request.COOKIES.get('access_token')
        
        if raw_token is None:
            # No cookie token, try header-based auth
            try:
                return super().authenticate(request)
            except (InvalidToken, TokenError):
                # No valid header token either, return None to allow AllowAny views
                return None
        
        try:
            # Validate the token
            validated_token = self.get_validated_token(raw_token)
            return self.get_user(validated_token), validated_token
        except (InvalidToken, TokenError):
            # Invalid token - return None to allow AllowAny views to work
            # For IsAuthenticated views, they will deny access
            return None

