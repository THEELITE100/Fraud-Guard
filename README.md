# Fraud Guard - Account Fraud Detection System

Fraud Guard is an AI-powered account fraud detection system that uses machine learning to identify potentially fraudulent accounts based on account ID patterns and characteristics.

## Features

- **ID-Based Fraud Detection:** Analyzes patterns in account IDs to identify potential fraud
- **Machine Learning Model:** Utilizes a Random Forest classifier trained on credit card transaction data
- **Web Interface:** Clean, modern UI for easy interaction with the fraud detection system
- **Real-time Analysis:** Instant fraud detection with confidence scoring
- **User Authentication:** Secure login system to protect the fraud detection tools

## Project Structure

- `app.py` - Main Flask application with fraud detection logic
- `analyze_fraud.ipynb` - Jupyter notebook with model development and dataset analysis
- `id_fraud_detection_model.pkl` - Trained machine learning model
- `templates/` - HTML templates for the web interface
- `static/` - CSS and JavaScript files for frontend functionality
- `requirements.txt` - Project dependencies

## Technology Stack

- **Backend:** Python, Flask
- **Frontend:** HTML, CSS, JavaScript
- **Machine Learning:** scikit-learn, pandas, numpy
- **Data:** Credit card transaction dataset (creditcard_2023.csv)

## Dataset

The model was trained using the Credit Card Fraud Detection Dataset 2023 available on Kaggle:
- [Credit Card Fraud Detection Dataset 2023](https://www.kaggle.com/datasets/nelgiriyewithana/credit-card-fraud-detection-dataset-2023)

This dataset contains anonymized credit card transactions labeled as fraudulent or legitimate, which was used to train the Random Forest classifier.

## Setup Instructions

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/fraud-guard.git
   cd fraud-guard
   ```

2. Create and activate a virtual environment (optional but recommended):
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Run the application:
   ```
   python app.py
   ```

5. Access the web interface at http://localhost:5000

## How It Works

Fraud Guard implements a two-pronged approach to fraud detection:

1. **Rules-Based Detection:**
   - Analyzes account ID characteristics (length, first/last digits, etc.)
   - Applies rules derived from pattern analysis in fraudulent accounts
   - Calculates a risk score based on multiple factors

2. **Machine Learning Model:**
   - Uses a Random Forest classifier trained on credit card transaction data
   - Incorporates ID-based features with transaction variables
   - Produces a fraud probability score

These approaches are combined to provide a comprehensive fraud risk assessment with a confidence rating.

## Usage

1. Log in using the credentials:
   - Username: `admin`
   - Password: `password123` (for demo purposes only)

2. Enter an account ID to check for potential fraud

3. View the fraud detection results, including:
   - Fraud determination (Legitimate/Fraudulent)
   - Risk score
   - Confidence level

## Model Development

The machine learning model was developed in `analyze_fraud.ipynb` using:
- Credit card transaction data with labeled fraud cases
- Feature engineering on account IDs
- Random Forest classifier for fraud prediction
- Evaluation metrics for model performance assessment

## License

[MIT License](LICENSE)
