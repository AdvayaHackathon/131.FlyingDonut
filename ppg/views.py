import os
import cv2
import numpy as np
import joblib
import time
from django.shortcuts import render
from django.http import HttpResponse
from scipy.signal import find_peaks, butter, filtfilt, welch
from scipy.ndimage import gaussian_filter1d
from sklearn.linear_model import SGDRegressor
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error

# --- CONFIGURATION & CONSTANTS ---

FPS = 30  # Frames per second for video capture
DURATION = 30  # Recording duration (seconds)
WINDOW_SIZE = 90  # Window size for feature extraction
STEP_SIZE = 45  # Sliding window step size
MIN_SAMPLES = 5  # Minimum number of windows required
METRICS = ['heart_rate', 'hrv', 'resp_rate', 'pulse_amp']
VALIDATION_RATIO = 0.2  # Train/validation split ratio
DRIFT_THRESHOLD = 0.15  # Concept drift threshold (MSE increase)

# Compute BASE_DIR as two levels up from this file and set the model directory.
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, 'ml_models')


# --- MODEL LOADING (using your provided snippet) ---

def load_models():
    """
    Loads ML models from the 'ml_models' directory located in BASE_DIR.
    Raises FileNotFoundError if any model file is missing.
    """
    models = {}
    model_files = {
        'heart_rate': 'heart_rate_model.pkl',
        'hrv': 'hrv_model.pkl',
        'pulse_amp': 'pulse_amp_model.pkl',
        'resp_rate': 'resp_rate_model.pkl'
    }
    for metric, file in model_files.items():
        model_path = os.path.join(MODEL_DIR, file)
        if os.path.exists(model_path):
            models[metric] = joblib.load(model_path)
        else:
            raise FileNotFoundError(f"Model file {file} not found in {MODEL_DIR}")
    return models


# --- SIGNAL PROCESSING & FEATURE EXTRACTION FUNCTIONS ---

def record_video(filename='ppg_capture.avi', duration=DURATION, fps=FPS):
    """
    Records a video from the default camera for the specified duration.
    """
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        raise RuntimeError("Error: Camera not accessible.")
    width = int(cap.get(3))
    height = int(cap.get(4))
    fourcc = cv2.VideoWriter_fourcc(*'XVID')
    out = cv2.VideoWriter(filename, fourcc, fps, (width, height))
    print(f"Recording for {duration} seconds. Cover camera with your fingertip.")
    start_time = time.time()
    while (time.time() - start_time) < duration:
        ret, frame = cap.read()
        if not ret:
            break
        remaining = max(0, int(duration - (time.time() - start_time)))
        cv2.putText(frame, f"Recording: {remaining}s", (20, 50),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 255), 3)
        out.write(frame)
        cv2.waitKey(1)
    cap.release()
    out.release()
    cv2.destroyAllWindows()
    return filename


def process_signal(signal, fps):
    """
    Applies bandpass filtering to the signal.
    """
    nyq = 0.5 * fps
    b, a = butter(2, [0.5 / nyq, 4.0 / nyq], btype='band')
    filtered = filtfilt(b, a, signal)
    return (filtered - np.mean(filtered)) / np.std(filtered)


def extract_features(signal, fps):
    """
    Extracts features from the processed signal using sliding windows.
    Features include mean, standard deviation, dominant frequency, energy,
    number of peaks, and the 75th percentile.
    """
    processed = process_signal(signal, fps)
    features = []
    for i in range(0, len(processed) - WINDOW_SIZE, STEP_SIZE):
        window = processed[i:i + WINDOW_SIZE]
        fft = np.abs(np.fft.fft(window))
        freqs = np.fft.fftfreq(len(window), 1 / fps)
        features.append([
            np.mean(window),
            np.std(window),
            freqs[np.argmax(fft)],
            np.sum(fft ** 2),
            len(find_peaks(window)[0]),
            np.percentile(window, 75)
        ])
    return np.array(features)


def traditional_measures(signal, fps):
    """
    Computes traditional PPG measures:
      - Heart rate (BPM)
      - Heart rate variability (ms)
      - Respiratory rate (breaths per minute)
      - Pulse amplitude
    """
    smoothed = gaussian_filter1d(signal - np.mean(signal), 2)
    peaks, _ = find_peaks(smoothed, distance=fps * 0.5)
    duration_secs = len(signal) / fps
    hr = len(peaks) / duration_secs * 60
    if len(peaks) > 1:
        rr_intervals = np.diff(peaks) / fps * 1000  # in milliseconds
        hrv = np.std(rr_intervals)
    else:
        hrv = 0
    freqs, psd = welch(smoothed, fs=fps, nperseg=256)
    resp_band = (freqs > 0.1) & (freqs < 0.5)
    if np.any(resp_band):
        resp_rate = freqs[resp_band][np.argmax(psd[resp_band])] * 60
    else:
        resp_rate = 0
    pulse_amplitude = np.max(smoothed) - np.min(smoothed)
    return hr, hrv, resp_rate, pulse_amplitude


# --- ML MODEL FUNCTIONS ---

# For tracking model performance (in-memory)
history_mse = {metric: [] for metric in METRICS}


def train_models_online(models, X, y_true, val_X, val_y):
    """
    Trains (or updates) each model using partial_fit with traditional measures
    as the ground truth. Tracks validation MSE to detect drift.
    """
    for i, metric in enumerate(METRICS):
        model = models[metric]
        scaler = model.named_steps['standardscaler']
        regressor = model.named_steps['sgdregressor']
        if not hasattr(scaler, 'mean_'):
            scaler.fit(X)
        X_scaled = scaler.transform(X)
        val_X_scaled = scaler.transform(val_X)
        for x_scaled in X_scaled:
            regressor.partial_fit(x_scaled.reshape(1, -1), [y_true[i]])
        preds = regressor.predict(val_X_scaled)
        val_target = np.array([val_y[i]] * len(val_X_scaled))
        mse = mean_squared_error(val_target, preds)
        history_mse[metric].append(mse)
        print(f"[Validation] {metric} MSE: {mse:.4f}")
        if len(history_mse[metric]) >= 5:
            recent = history_mse[metric][-3:]
            old_avg = np.mean(history_mse[metric][:-3])
            recent_avg = np.mean(recent)
            if old_avg and abs(recent_avg - old_avg) / old_avg > DRIFT_THRESHOLD:
                print(f"[Drift Warning] Significant change in '{metric}' performance.")
        # Save the model back to MODEL_DIR
        joblib.dump(model, os.path.join(MODEL_DIR, f"{metric}_model.pkl"))


def predict_metrics(models, X):
    """
    Uses each ML model to predict an enhanced metric based on the average
    of all feature windows.
    """
    predictions = {}
    X_avg = X.mean(axis=0).reshape(1, -1)
    for metric in METRICS:
        predictions[metric] = models[metric].predict(X_avg)[0]
    return predictions


def evaluate_model(preds, truths):
    """
    Compares ML predictions with traditional measurements.
    Returns a dictionary with MAE, MSE, and relative error for each metric.
    """
    evaluation = {}
    for i, metric in enumerate(METRICS):
        true_val = truths[i]
        pred_val = preds[metric]
        mae = mean_absolute_error([true_val], [pred_val])
        mse = mean_squared_error([true_val], [pred_val])
        rel_error = (abs(true_val - pred_val) / true_val * 100) if true_val != 0 else 0
        evaluation[metric] = {
            "mae": round(mae, 2),
            "mse": round(mse, 2),
            "relative_error": round(rel_error, 2)
        }
    return evaluation


# --- DJANGO VIEWS ---

def ppg_analysis(request):
    """
    Records a 30-second video from the webcam, processes the video to extract
    a cyan-channel signal, computes traditional PPG measures, extracts features,
    loads the four ML models from BASE_DIR/ml_models, trains/updates them online,
    predicts enhanced metrics, evaluates the predictions versus traditional values,
    and renders the results page.
    """
    try:
        # Step 1: Record video and get filename
        video_filename = record_video()

        # Step 2: Open the video and extract the PPG signal (using the cyan channel)
        cap = cv2.VideoCapture(video_filename)
        signal_data = []
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            # Cyan signal: average of blue and green channels
            cyan_signal = np.mean(frame[:, :, [0, 1]], axis=2)
            signal_data.append(np.mean(cyan_signal))
        cap.release()
        signal_data = np.array(signal_data)

        # Step 3: Compute traditional PPG measures
        trad_hr, trad_hrv, trad_resp, trad_pulse = traditional_measures(signal_data, fps=FPS)
        traditional_dict = {
            "heart_rate": round(trad_hr, 2),
            "hrv": round(trad_hrv, 2),
            "resp_rate": round(trad_resp, 2),
            "pulse_amp": round(trad_pulse, 2)
        }

        # Step 4: Extract features for ML prediction
        X_new = extract_features(signal_data, fps=FPS)
        if len(X_new) < MIN_SAMPLES:
            return HttpResponse(f"Error: Need at least {MIN_SAMPLES} windows for analysis. Got {len(X_new)}.",
                                status=400)
        split_idx = int((1 - VALIDATION_RATIO) * len(X_new))
        X_train, X_val = X_new[:split_idx], X_new[split_idx:]

        # Step 5: Load ML models using the provided snippet from MODEL_DIR
        models = load_models()

        # Step 6: Train/update ML models online using traditional measures as ground truth
        true_vals = [trad_hr, trad_hrv, trad_resp, trad_pulse]
        train_models_online(models, X_train, true_vals, X_val, true_vals)

        # Step 7: Make ML-enhanced predictions and evaluate against traditional values
        ml_preds = predict_metrics(models, X_new)
        ml_preds = {k: round(v, 2) for k, v in ml_preds.items()}
        evaluation = evaluate_model(ml_preds, true_vals)

        # Prepare context data for rendering
        context = {
            "traditional": traditional_dict,
            "ml_predictions": ml_preds,
            "evaluation": evaluation
        }
        return render(request, "results.html", context)
    except Exception as e:
        return HttpResponse(f"Error during PPG analysis: {str(e)}", status=500)


def loadppg(request):
    """
    Loads the PPG measurement page.
    """
    return render(request, "index.html")
def load_base(request):
    return render(request,"base.html")