import pandas as pd
import numpy as np
import xgboost as xgb
import shap
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from imblearn.over_sampling import SMOTE
import pickle
import warnings

warnings.filterwarnings("ignore", category=UserWarning)

class CreditRiskModel:
    def __init__(self, model_path='credit_risk_model.pkl', explainer_path='shap_explainer.pkl', columns_path='model_columns.pkl'):
        self.model = None
        self.explainer = None
        self.model_columns = None
        self.model_path = model_path
        self.explainer_path = explainer_path
        self.columns_path = columns_path

    def _preprocess(self, df, is_training=True):
        df = df.copy()
        if is_training and 'loan_status' in df.columns:
            good_loan_statuses = ['Fully Paid', 'Does not meet the credit policy. Status:Fully Paid']
            bad_loan_statuses = ['Charged Off', 'Default', 'Does not meet the credit policy. Status:Charged Off']
            df = df[df['loan_status'].isin(good_loan_statuses + bad_loan_statuses)]
            df['is_default'] = df['loan_status'].apply(lambda x: 1 if x in bad_loan_statuses else 0)

        if 'term' in df.columns:
            df['term'] = df['term'].astype(str).str.extract('(\\d+)').astype(float)

        if 'emp_length' in df.columns:
            if is_training:
                df['emp_length'] = df['emp_length'].str.replace(' years', '').str.replace(' year', '').str.replace('+', '', regex=False).str.replace('< 1', '0')
            df['emp_length'] = pd.to_numeric(df['emp_length'], errors='coerce').fillna(0).astype(float)

        # *** FIX: Moved date feature engineering to run for both training and prediction ***
        if 'issue_d' in df.columns and 'earliest_cr_line' in df.columns:
            df['issue_d'] = pd.to_datetime(df['issue_d'], errors='coerce')
            df['earliest_cr_line'] = pd.to_datetime(df['earliest_cr_line'], errors='coerce')
            df['credit_history_length'] = (df['issue_d'] - df['earliest_cr_line']).dt.days
            # Only fill NaNs during training; for prediction, we assume the data is complete or will be handled by reindex
            if is_training:
                df['credit_history_length'] = df['credit_history_length'].fillna(df['credit_history_length'].median())

        categorical_cols = df.select_dtypes(include='object').columns.tolist()
        cols_to_drop = [
            'id', 'member_id', 'url', 'desc', 'title', 'emp_title', 'zip_code', 'addr_state', 'loan_status',
            'issue_d', 'earliest_cr_line', 'total_pymnt', 'total_pymnt_inv', 'total_rec_prncp', 'total_rec_int',
            'total_rec_late_fee', 'recoveries', 'collection_recovery_fee', 'last_pymnt_d', 'last_pymnt_amnt',
            'last_credit_pull_d', 'out_prncp', 'out_prncp_inv'
        ]

        for col in cols_to_drop:
            if col in categorical_cols:
                categorical_cols.remove(col)
        df = df.drop(columns=[col for col in cols_to_drop if col in df.columns])
        df = pd.get_dummies(df, columns=categorical_cols, drop_first=True)
        return df

    def train(self, data_path):
        print("Starting model training process...")
        print("[DEBUG] Loading data in chunks for efficient sampling...")
        chunk_list = []
        chunksize = 100000
        with pd.read_csv(data_path, low_memory=False, chunksize=chunksize) as reader:
            for chunk in reader:
                chunk_list.append(chunk.sample(frac=0.1, random_state=42))
        df_raw = pd.concat(chunk_list, ignore_index=True)
        print(f"[DEBUG] Sampled data loaded. Shape: {df_raw.shape}")

        print("[DEBUG] Data loaded. Starting preprocessing...")
        df_processed = self._preprocess(df_raw, is_training=True)

        missing_percentage = df_processed.isnull().sum() / len(df_processed)
        cols_to_drop_nulls = missing_percentage[missing_percentage > 0.4].index
        df_processed = df_processed.drop(columns=cols_to_drop_nulls)
        df_final = df_processed.fillna(df_processed.median())

        X = df_final.drop('is_default', axis=1)
        y = df_final['is_default']
        self.model_columns = X.columns
        with open(self.columns_path, 'wb') as f: pickle.dump(self.model_columns, f)

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

        print("[DEBUG] Applying SMOTE to the training data. This can take several minutes...")
        smote = SMOTE(random_state=42)
        X_train_resampled, y_train_resampled = smote.fit_resample(X_train, y_train)
        print("[DEBUG] SMOTE complete.")

        print("Training XGBoost Classifier...")
        self.model = xgb.XGBClassifier(objective='binary:logistic', eval_metric='logloss', random_state=42, use_label_encoder=False)
        print("[DEBUG] Starting model.fit()...")
        self.model.fit(X_train_resampled, y_train_resampled)
        print("Training complete.")

        y_pred = self.model.predict(X_test)
        print("\nClassification Report on Test Set:")
        print(classification_report(y_test, y_pred, target_names=['Good Loan', 'Default']))

        self.explainer = shap.TreeExplainer(self.model)
        with open(self.model_path, 'wb') as f: pickle.dump(self.model, f)
        with open(self.explainer_path, 'wb') as f: pickle.dump(self.explainer, f)
        print(f"\nModel, explainer, and columns saved to {self.model_path}, {self.explainer_path}, and {self.columns_path}")

    def load(self):
        with open(self.model_path, 'rb') as f: self.model = pickle.load(f)
        with open(self.explainer_path, 'rb') as f: self.explainer = pickle.load(f)
        with open(self.columns_path, 'rb') as f: self.model_columns = pickle.load(f)
        print("Model, explainer, and columns loaded successfully.")

    def predict(self, new_data):
        if self.model is None: self.load()
        df_processed = self._preprocess(new_data, is_training=False)

        df_aligned = df_processed.reindex(columns=self.model_columns, fill_value=0)

        for col in df_aligned.columns:
            if col in self.model.get_booster().feature_names:
                if pd.api.types.is_numeric_dtype(df_aligned[col]):
                    df_aligned[col] = df_aligned[col].astype(float)

        prediction_proba = self.model.predict_proba(df_aligned)[:, 1]
        shap_values = self.explainer.shap_values(df_aligned)
        results = []
        for i in range(len(df_aligned)):
            explanation = {feature: float(shap_values[i, j]) for j, feature in enumerate(self.model_columns)}
            results.append({
                'default_probability': float(prediction_proba[i]),
                'explanation': explanation
            })
        return results

if __name__ == '__main__':
    data_path = 'ai_lending_club_loan_data/accepted_2007_to_2018Q4.csv.gz'
    risk_model = CreditRiskModel()
    risk_model.train(data_path)

