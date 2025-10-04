# api.py

import joblib
import pandas as pd
from scipy.sparse import hstack
from urllib.parse import urlparse
from flask import Flask, request, jsonify
from flask_cors import CORS # <-- 1. YEH LINE ADD KAREIN

from feature_extractor import generate_features

# ... (baaki ka code waisa hi rahega) ...

# --- 2. Flask App Banayein ---
app = Flask(__name__)
CORS(app) # <-- 2. YEH LINE ADD KAREIN

# ... (baaki ka poora code waisa hi rahega) ...

# Hamara feature extractor import karein
from feature_extractor import generate_features

# --- 1. Model aur zaroori cheezein load karein ---
# Yeh code server start hote hi sirf ek baar chalega,
# taaki har request par model load na karna pade.
print("Loading model and assets...")
model_data = joblib.load('advanced_phishing_model.pkl')
model = model_data['model']
tfidf_vectorizer = model_data['tfidf_vectorizer']
rule_based_features_cols = model_data['rule_based_features_cols']
print("Model and assets loaded successfully.")

# --- WHITELIST ---
WHITELIST = {
    'google.com',
    'youtube.com',
    'facebook.com',
    'github.com',
    'microsoft.com',
    'apple.com',
    'salesforce.com',
    'wikipedia.org',
    'accounts.google.com',
    'code.visualstudio.com',
    'https://khalsaengineering.co.in/',
    'kcet.co.in',
    'anvithaclubglbajaj.netlify.app'
}

# --- 2. Flask App Banayein ---
app = Flask(__name__)

# --- 3. API Endpoint Banayein ---
@app.route('/predict', methods=['POST'])
def predict():
    # Request se JSON data lein
    data = request.get_json()
    if not data or 'url' not in data:
        return jsonify({'error': 'Invalid input. Please provide a URL in the JSON body.'}), 400

    url = data['url']
    print(f"Received URL for prediction: {url}")

    # --- 4. Prediction Logic (predict_advanced.py se copy kiya gaya) ---
    
    # Whitelist check
    try:
        processed_url = url if url.startswith('http') else 'http://' + url
        domain = urlparse(processed_url).netloc
        clean_domain = domain.replace('www.', '')
        
        if clean_domain in WHITELIST:
            print("URL is whitelisted.")
            response = {
                'url': url,
                'status': 'Safe',
                'reason': 'Whitelisted',
                'phishing_chance': 0.0
            }
            return jsonify(response)
    except Exception:
        pass

    # Model se prediction
    try:
        rule_based_features = pd.DataFrame([generate_features(url)], columns=rule_based_features_cols)
        tfidf_features = tfidf_vectorizer.transform([url])
        X_new = hstack([rule_based_features, tfidf_features])

        probability = model.predict_proba(X_new)[0, 1] * 100
        
        status = ""
        if probability > 70:
            status = "Dangerous"
        elif probability > 40:
            status = "Suspicious"
        else:
            status = "Safe"

        response = {
            'url': url,
            'status': status,
            'reason': 'Model Prediction',
            'phishing_chance': round(probability, 2)
        }
        print(f"Prediction successful: {response}")
        return jsonify(response)
        
    except Exception as e:
        print(f"An error occurred during prediction: {e}")
        return jsonify({'error': 'Could not process the URL.'}), 500

# --- 5. Server ko Run Karein ---
if __name__ == '__main__':
    # debug=True development ke liye hai. Production mein isse False kar dein.
    app.run(port=5000, debug=True)