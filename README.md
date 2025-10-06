# Credit Risk Prediction System

An end-to-end machine learning application that predicts loan default probability using XGBoost with SHAP explainability, Flask API backend, and a modern React frontend featuring Firebase authentication and real-time prediction history.

![Python](https://img.shields.io/badge/python-3.8+-blue.svg)
![React](https://img.shields.io/badge/react-19.1.1-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## Overview

This system analyzes loan applicant data to predict the likelihood of default, providing both a risk score and transparent explanations of which factors influence the prediction. Built for financial institutions or lenders who need interpretable AI-driven credit risk assessments.

### Key Features

- **Machine Learning Pipeline**: XGBoost classifier trained on Lending Club historical data (2007-2018)
- **Explainable AI**: SHAP values showing which features increase/decrease default risk
- **REST API**: Flask backend with CORS support for predictions
- **User Authentication**: Firebase email/password authentication with password reset
- **Real-time History**: Cloud Firestore for storing and displaying user-specific prediction history
- **Modern UI**: React with Tailwind CSS, glassmorphic design, and smooth animations

## Tech Stack

### Backend
- **Python 3.8+**
- Flask - REST API framework
- XGBoost - Gradient boosting classifier
- SHAP - Model interpretability
- scikit-learn - ML utilities
- imbalanced-learn (SMOTE) - Handling class imbalance
- pandas/numpy - Data processing

### Frontend
- **React 19** with Vite
- **Tailwind CSS 4** - Styling
- **Firebase** - Authentication & Firestore database
- **Lucide React** - Icons

## Project Structure

```
credit-risk-ml/
├── credit_risk_model.py      # ML model training & prediction logic
├── api.py                     # Flask REST API
├── requirements.txt           # Python dependencies
├── src/
│   ├── App.jsx               # Main React component with auth
│   ├── main.jsx              # React entry point
│   ├── index.css             # Tailwind configuration
│   └── dashboard.jsx         # Alternative dashboard (legacy)
└── package.json              # Node.js dependencies
```

## Installation

### Prerequisites
- Python 3.8 or higher
- Node.js 16 or higher
- Firebase account (for authentication and database)

### Backend Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/credit-risk-ml.git
cd credit-risk-ml
```

2. Create a virtual environment and install dependencies:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Download the Lending Club dataset:
   - Place `accepted_2007_to_2018Q4.csv.gz` in `ai_lending_club_loan_data/` directory
   - Dataset available from [Kaggle Lending Club Dataset](https://www.kaggle.com/datasets/wordsforthewise/lending-club)

4. Train the model (this may take several minutes):
```bash
python credit_risk_model.py
```

This will generate:
- `credit_risk_model.pkl` - Trained XGBoost model
- `shap_explainer.pkl` - SHAP explainer
- `model_columns.pkl` - Feature columns

5. Start the Flask API:
```bash
python api.py
```

The API will run on `http://127.0.0.1:5001`

### Frontend Setup

1. Install Node.js dependencies:
```bash
npm install
```

2. Configure Firebase:
   - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable Email/Password authentication
   - Create a Firestore database in test mode
   - Copy your Firebase configuration from Project Settings
   - Replace the `firebaseConfig` object in `src/App.jsx` with your credentials

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Usage

### User Flow

1. **Sign Up / Sign In**: Create an account or log in with existing credentials
2. **Enter Loan Data**: Fill in the application form with:
   - Loan amount and interest rate
   - Annual income and employment length
   - Loan term, grade, home ownership status
   - Loan purpose
3. **Get Prediction**: Click "Calculate Risk Score" to receive:
   - Default probability percentage
   - Risk level (Low/Medium/High)
   - Top 10 features influencing the prediction
4. **View History**: See all your past predictions in the history panel

### API Endpoints

#### `POST /predict`
Predicts loan default probability.

**Request Body:**
```json
{
  "loan_amnt": 10000,
  "int_rate": 11.5,
  "annual_inc": 75000,
  "emp_length": 5,
  "term": " 36 months",
  "grade": "B",
  "home_ownership": "MORTGAGE",
  "purpose": "debt_consolidation",
  "dti": 20.0,
  "fico_range_low": 690,
  "fico_range_high": 694,
  "open_acc": 10,
  "pub_rec": 0,
  "revol_bal": 15000,
  "revol_util": 50.0,
  "total_acc": 25,
  "issue_d": "Dec-2015",
  "earliest_cr_line": "Jan-2005"
}
```

**Response:**
```json
{
  "default_probability": 0.234,
  "explanation": {
    "int_rate": 0.045,
    "annual_inc": -0.023,
    "loan_amnt": 0.012,
    ...
  }
}
```

## Model Details

### Training Process

1. **Data Loading**: Samples 10% of Lending Club data for efficient training
2. **Preprocessing**:
   - Extracts numeric values from term and employment length
   - Calculates credit history length from date fields
   - One-hot encodes categorical variables
   - Handles missing values (drops columns >40% missing, fills rest with median)
3. **Class Balancing**: Applies SMOTE to training data
4. **Model Training**: XGBoost binary classifier with logloss evaluation
5. **Explainability**: Trains SHAP TreeExplainer for feature importance

### Performance

The model is evaluated on a held-out test set with classification reports showing precision, recall, and F1-scores for both "Good Loan" and "Default" classes.

### Input Features

The model accepts the following features:
- **Loan Details**: amount, interest rate, term, grade, purpose
- **Applicant Profile**: annual income, employment length, home ownership
- **Credit Metrics**: DTI, FICO scores, open accounts, public records, revolving balance/utilization, total accounts
- **Credit History**: issue date, earliest credit line (for history length calculation)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Lending Club for providing the historical loan data
- SHAP library for model interpretability
- Firebase for authentication and database infrastructure

## Contact

Aiden Kim - ajk041@bucknell.edu

Project Link: [https://github.com/A319K/credit-risk-model]

---
