from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()

    url = data.get("url", "").lower()

    keywords = ["login", "verify", "secure", "update", "bank", "paypal", "account"]

    score = 0
    triggered = []

    for k in keywords:
        if k in url:
            score += 15
            triggered.append(k)

    if url.endswith(".xyz"):
        score += 25
        triggered.append("suspicious_tld_xyz")

    if score >= 70:
        status = "Dangerous"
    elif score >= 40:
        status = "Suspicious"
    else:
        status = "Safe"

    return jsonify({
        "url": url,
        "status": status,
        "phishing_chance": min(score, 100),
        "signals_triggered": triggered
    })

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
