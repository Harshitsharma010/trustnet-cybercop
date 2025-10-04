# feature_extractor.py (Updated with Error Handling)

import re
from urllib.parse import urlparse

# NEW SCHEME: 0 for Legitimate, 1 for Phishing/Suspicious

def has_ip_address(url):
    return 1 if re.search(r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b', urlparse(url).netloc) else 0

def url_length(url):
    return 1 if len(url) >= 54 else 0

def has_shortening_service(url):
    shorteners = ['bit.ly', 'goo.gl', 'tinyurl', 't.co', 'shorte.st']
    return 1 if any(shortener in url for shortener in shorteners) else 0

def has_at_symbol(url):
    return 1 if '@' in url else 0

def has_double_slash_redirect(url):
    return 1 if url.rfind('//') > 7 else 0

def has_prefix_suffix(url):
    return 1 if '-' in urlparse(url).netloc else 0

def count_subdomains(url):
    netloc = urlparse(url).netloc.replace('www.', '')
    return 1 if netloc.count('.') > 2 else 0

def has_https_token(url):
    return 1 if 'https' in urlparse(url).netloc else 0

def has_suspicious_keywords(url):
    keywords = ['login', 'secure', 'account', 'update', 'banking', 'signin', 'confirm', 'verify', 'password']
    return 1 if any(keyword in url.lower() for keyword in keywords) else 0
    
def generate_features(url):
    """
    Main function to generate a dictionary of all features for a given URL.
    Now includes error handling for malformed URLs.
    """
    # Create a dictionary with default "safe" values
    default_features = {
        'has_ip': 0, 'url_length': 0, 'has_shortener': 0, 'has_at': 0,
        'has_double_slash': 0, 'has_prefix_suffix': 0, 'num_subdomains': 0,
        'has_https_token': 0, 'has_keywords': 0
    }

    # First, check if the url is a valid string. If not, return defaults.
    if not isinstance(url, str):
        return default_features

    try:
        # If parsing or feature extraction fails, the 'except' block will run
        features = {
            'has_ip': has_ip_address(url),
            'url_length': url_length(url),
            'has_shortener': has_shortening_service(url),
            'has_at': has_at_symbol(url),
            'has_double_slash': has_double_slash_redirect(url),
            'has_prefix_suffix': has_prefix_suffix(url),
            'num_subdomains': count_subdomains(url),
            'has_https_token': has_https_token(url),
            'has_keywords': has_suspicious_keywords(url)
        }
        return features
    except Exception:
        # If any error occurs, return the default "safe" features
        return default_features