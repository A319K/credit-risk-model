from flask import Flask, request, jsonify
import pandas as pd
from credit_risk_model import CreditRiskModel
import traceback
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

model = CreditRiskModel()

@app.route('/predict', methods=['POST'])
def predict():
    """
    API endpoint to predict credit risk.
    Expects a JSON payload with applicant data.
    """
    try:
        # Get the JSON data from the request
        json_data = request.get_json()
        print(f"[DEBUG] Received data: {json_data}")  # Added logging

        # Convert the JSON data into a pandas DataFrame
        applicant_data = pd.DataFrame([json_data])
        print(f"[DEBUG] DataFrame created, shape: {applicant_data.shape}")  # Added logging

        # Use our model's predict method to get the result
        print("[DEBUG] Calling model.predict()...")  # Added logging
        result = model.predict(applicant_data)[0]
        print(f"[DEBUG] Prediction successful: {result}")  # Added logging

        return jsonify(result)

    except Exception as e:
        # Print the full error to the terminal
        print(f"[ERROR] Exception occurred: {str(e)}")
        print(f"[ERROR] Full traceback:")
        print(traceback.format_exc())

        # Return error to the browser
        return jsonify({
            'error': str(e),
            'trace': traceback.format_exc()
        }), 500

if __name__ == '__main__':
    print("Loading the credit risk model...")
    model.load()
    print("Model loaded successfully. Starting API server...")

    app.run(host='0.0.0.0', port=5001, debug=True)