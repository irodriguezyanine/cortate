import os

class Config:
    DEBUG = True
    SECRET_KEY = os.environ.get("SECRET_KEY", "super-secret-key")
    GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "AIzaSyDj7gIzf_lDToiZQbMN5_XSfZCxDp_rGjg")
