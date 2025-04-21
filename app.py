from flask import Flask, request, jsonify, render_template, redirect, url_for, session, flash
import joblib
import numpy as np
from sklearn.preprocessing import StandardScaler
import logging
import traceback
from functools import wraps
import os

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.secret_key = os.urandom(24)  # For session management

# Note: Fraud detection patterns are derived from analyze_fraud.ipynb
# Dummy user database 
USERS = {
    "admin": "password123", 
}

try:
    # Load the trained model
    model = joblib.load('id_fraud_detection_model.pkl')
    logger.info("Model loaded successfully")
    
    # Initialize scaler
    scaler = StandardScaler()
except Exception as e:
    logger.error(f"Error loading model: {str(e)}")
    logger.error(traceback.format_exc())
    raise

# Login required decorator
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'username' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

@app.route('/')
@login_required
def home():
    return render_template('index.html', username=session['username'])

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        if username in USERS and USERS[username] == password:
            session['username'] = username
            return redirect(url_for('home'))
        else:
            return render_template('login.html', error='Invalid username or password')
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('username', None)
    return redirect(url_for('login'))

@app.route('/check_transaction', methods=['POST'])
@login_required
def check_transaction():
    try:
        # Get and validate the request data
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        if 'account_id' not in data:
            return jsonify({"error": "Account ID is required"}), 400
        
        # Extract and validate account ID
        try:
            account_id = str(data['account_id'])
        except (ValueError, TypeError):
            return jsonify({"error": "Invalid data format"}), 400
        
        # Log the received account check
        logger.info(f"Checking account - ID: {account_id}")
        
        # ID-based fraud detection based on dataset analysis in analyze_fraud.ipynb
        # Extract features from the account ID
        id_length = len(account_id)
        id_first_digit = int(account_id[0]) if account_id and account_id[0].isdigit() else 0
        id_last_digit = int(account_id[-1]) if account_id and account_id[-1].isdigit() else 0
        id_sum_digits = sum(int(digit) for digit in account_id if digit.isdigit())
        id_num_unique_digits = len(set(digit for digit in account_id if digit.isdigit()))
        
        # Rules derived from dataset analysis
        high_risk_first_digits = [1, 4, 6]
        high_risk_last_digits = [1, 7, 9]
        avg_fraud_id_length = 5
        avg_fraud_sum_digits = 22
        
        # Calculate risk score (higher = more likely to be fraud)
        # The maximum possible score is 100 (indicating safe)
        # Lower scores indicate higher risk
        risk_score = 0
        
        # Apply rules based on our analysis (each rule adds points to the risk score)
        # For first digit - up to 30 points
        if id_first_digit in high_risk_first_digits:
            # First digit is high risk - add 0 points (30 points lost)
            logger.debug(f"High risk first digit: {id_first_digit}")
        else:
            # First digit is low risk - add 30 points
            risk_score += 30
        
        # For last digit - up to 25 points
        if id_last_digit in high_risk_last_digits:
            # Last digit is high risk - add 0 points (25 points lost)
            logger.debug(f"High risk last digit: {id_last_digit}")
        else:
            # Last digit is low risk - add 25 points
            risk_score += 25
        
        # Check ID length (closer to average fraud length = higher risk) - up to 20 points
        length_difference = abs(id_length - avg_fraud_id_length)
        if length_difference <= 1:
            # Length matches fraud pattern - add 0 points (20 points lost)
            logger.debug(f"ID length matches fraud pattern: {id_length}")
        else:
            # Length doesn't match fraud pattern - add 20 points
            risk_score += 20
        
        # Check sum of digits (closer to average fraud sum = higher risk) - up to 15 points
        sum_difference = abs(id_sum_digits - avg_fraud_sum_digits)
        if sum_difference <= 3:
            # Sum matches fraud pattern - add 0 points (15 points lost)
            logger.debug(f"Sum of digits matches fraud pattern: {id_sum_digits}")
        else:
            # Sum doesn't match fraud pattern - add 15 points
            risk_score += 15
        
        # If ID has few unique digits (less diversity), higher fraud risk - up to 10 points
        if id_num_unique_digits <= 3:
            # Low unique digits - add 0 points (10 points lost)
            logger.debug(f"Low unique digits: {id_num_unique_digits}")
        else:
            # Diverse digits - add 10 points
            risk_score += 10
            
        # IMPORTANT: Note that our scale is now inverted:
        # Higher score = safer
        # Lower score = more likely to be fraudulent
        
        # Create feature vector for model
        features = [id_length, id_first_digit, id_last_digit, id_sum_digits, id_num_unique_digits]
        
        # For other features (V1-V28), we use default values since we don't have them
        # This is not ideal but allows us to use the model
        for _ in range(28):
            features.append(0.0)
        
        try:
            # Use id_fraud_detection_model.pkl for prediction
            prediction = model.predict([features])
            prediction_proba = model.predict_proba([features])[0]
            
            # Use the model's probability to influence the risk score
            # If model predicts fraud with high confidence, reduce the risk score
            if prediction[0] == 1:  # Model predicts fraud
                # Reduce risk score proportionally to the fraud probability
                fraud_proba = prediction_proba[1]  # Probability of fraud
                risk_score = max(0, risk_score - int(fraud_proba * 50))
            else:  # Model predicts legitimate
                # Increase risk score proportionally to the legitimate probability
                legit_proba = prediction_proba[0]  # Probability of legitimate
                risk_score = min(99, risk_score + int(legit_proba * 20))
            
            # Update fraud determination based on new risk score
            is_fraudulent = risk_score < 50
            
            # Calculate confidence level
            confidence = "high" if abs(risk_score - 50) > 30 else "medium" if abs(risk_score - 50) > 15 else "low"
            
            logger.info(f"Model-adjusted risk score: {risk_score}")
            logger.info(f"Final determination: {'Fraudulent' if is_fraudulent else 'Legitimate'} (Confidence: {confidence})")
        except Exception as model_error:
            # If model fails, use rules-based approach
            logger.error(f"Model error: {str(model_error)}. Using rules-based detection.")
            # Determine if fraudulent based on risk score
            is_fraudulent = risk_score < 50
            confidence = "medium" if abs(risk_score - 50) > 15 else "low"
            logger.info(f"Rules-based detection: {'Fraudulent' if is_fraudulent else 'Legitimate'} (Score: {risk_score}, Confidence: {confidence})")
        
        # Return the result
        return jsonify({
            "result": 'Fraudulent' if is_fraudulent else 'Legitimate',
            "confidence": confidence,
            "risk_score": risk_score,
        })

    except Exception as e:
        logger.error(f"Error processing account check: {str(e)}")
        logger.error(traceback.format_exc())
        return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    app.run(debug=True)
