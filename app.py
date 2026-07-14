from flask import Flask, request, redirect, url_for, flash, session, jsonify
from flask_cors import CORS
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from functools import wraps
import os
from dotenv import load_dotenv
from groq import Groq
import json
import time
from datetime import datetime

load_dotenv()

# Initialize Groq client
client = Groq(
    api_key=os.getenv("GROQ_API_KEY"),
)

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")

# Enable CORS for React dev server
CORS(app, supports_credentials=True, origins=["http://localhost:5173", "http://127.0.0.1:5173"])

# ---------------- CONFIG ----------------
DATABASE = "database.db"
UPLOAD_FOLDER = "static/uploads/video"
ALLOWED_EXTENSIONS = {"webm", "wav", "mp4"}
ADMIN_EMAIL = "admin@gmail.com"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# ---------------- DATABASE ----------------
def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def create_table():
    conn = get_db_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL,
            email TEXT NOT NULL,
            password TEXT NOT NULL,
            background TEXT,
            CONSTRAINT uq_email UNIQUE (email),
            CONSTRAINT uq_phone UNIQUE (phone)
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS interviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            interview_name TEXT,
            score REAL,
            total_questions INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    try:
        conn.execute("ALTER TABLE interviews ADD COLUMN questions_json TEXT")
    except sqlite3.OperationalError:
        pass
    try:
        conn.execute("ALTER TABLE interviews ADD COLUMN config_json TEXT")
    except sqlite3.OperationalError:
        pass
    conn.commit()
    conn.close()

create_table()

# ---------------- DECORATORS ----------------
def login_required(route):
    @wraps(route)
    def wrapper(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "Authentication required"}), 401
        return route(*args, **kwargs)
    return wrapper

def admin_required(route):
    @wraps(route)
    def wrapper(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"error": "Authentication required"}), 401
        if session.get("user_email") != ADMIN_EMAIL:
            return jsonify({"error": "Admin access required"}), 403
        return route(*args, **kwargs)
    return wrapper

# ============================================
#               API ROUTES
# ============================================

# -------- Auth Status --------
@app.route("/api/auth/status")
def auth_status():
    if "user_id" in session:
        return jsonify({
            "authenticated": True,
            "user": {
                "id": session["user_id"],
                "name": session["user_name"],
                "email": session["user_email"],
                "is_admin": session.get("user_email") == ADMIN_EMAIL
            }
        })
    return jsonify({"authenticated": False})

# -------- Signup --------
@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.json
    name = data.get("name", "").strip()
    phone = data.get("phone", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    background = data.get("background", "").strip()

    if not name or not email or not password:
        return jsonify({"error": "Name, email, and password are required."}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters."}), 400

    hashed = generate_password_hash(password)
    conn = get_db_connection()
    try:
        # Explicit duplicate checks (works even on DBs without retroactive UNIQUE constraint)
        if conn.execute("SELECT 1 FROM users WHERE email = ?", (email,)).fetchone():
            return jsonify({"error": "An account with this email already exists."}), 409
        if phone and conn.execute("SELECT 1 FROM users WHERE phone = ?", (phone,)).fetchone():
            return jsonify({"error": "An account with this phone number already exists."}), 409

        conn.execute(
            "INSERT INTO users (name, phone, email, password, background) VALUES (?, ?, ?, ?, ?)",
            (name, phone, email, hashed, background)
        )
        conn.commit()
        return jsonify({"message": "Account created successfully! Please log in."}), 201
    except sqlite3.IntegrityError as e:
        err = str(e).lower()
        if "phone" in err:
            return jsonify({"error": "An account with this phone number already exists."}), 409
        return jsonify({"error": "An account with this email already exists."}), 409
    finally:
        conn.close()


# -------- Login --------
@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    start_time = time.time()
    conn = get_db_connection()
    user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()
    if user and check_password_hash(user["password"], password):
        session["user_id"] = user["id"]
        session["user_name"] = user["name"]
        session["user_email"] = user["email"]
        duration_ms = int((time.time() - start_time) * 1000)
        # Log successful login
        with open("login_times.log", "a") as f:
            f.write(f"{datetime.utcnow().isoformat()} - {email} - {duration_ms}ms\n")
        return jsonify({
            "message": f"Welcome {user['name']}!",
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "is_admin": user["email"] == ADMIN_EMAIL
            },
            "duration_ms": duration_ms
        })
    duration_ms = int((time.time() - start_time) * 1000)
    # Log failed login
    with open("login_times.log", "a") as f:
        f.write(f"{datetime.utcnow().isoformat()} - {email} - FAILED - {duration_ms}ms\n")
    return jsonify({"error": "Invalid email or password."}), 401



# -------- Logout --------
@app.route("/api/logout", methods=["POST"])
@login_required
def logout():
    session.clear()
    return jsonify({"message": "Logged out successfully."})

# -------- Upload Audio --------
@app.route("/api/upload-audio", methods=["POST"])
@login_required
def upload_audio():
    if "audio" not in request.files:
        return jsonify({"error": "No audio file"}), 400

    file = request.files["audio"]
    if file.filename == "":
        return jsonify({"error": "Empty filename"}), 400

    ext = file.filename.rsplit(".", 1)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return jsonify({"error": "Invalid file type"}), 400

    filename = secure_filename(f"user_{session['user_id']}_interview.{ext}")
    file_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
    file.save(file_path)

    # Transcription
    try:
        with open(file_path, "rb") as f:
            transcription = client.audio.transcriptions.create(
                file=(filename, f.read()),
                model="whisper-large-v3",
                response_format="json",
                language="en",
                temperature=0.0
            )
        transcript_text = transcription.text
    except Exception as e:
        print(f"Transcription error: {e}")
        transcript_text = f"Error generating transcription: {str(e)}"

    return jsonify({
        "message": "Audio uploaded successfully",
        "file": filename,
        "transcription": transcript_text
    })

# -------- AI Question Generation --------
@app.route("/api/generate-questions", methods=["POST"])
@login_required
def generate_questions():
    data = request.json
    interview_name = data.get("interviewName")
    objectives = data.get("objectives")
    num_qs = data.get("numQs")
    difficulty = data.get("difficulty", "Mixed")

    if not interview_name or not objectives or not num_qs:
        return jsonify({"error": "Missing fields"}), 400

    try:
        num_qs = int(num_qs)
    except (TypeError, ValueError):
        return jsonify({"error": "numQs must be an integer"}), 400

    prompt = (
        f"Create {num_qs} unique interview questions for {interview_name} "
        f"based on these topics: {objectives}. "
        f"The difficulty level of the questions should be: {difficulty}. "
        "Make the questions clear, varied, and suitable for interview purposes. "
        "Strictly return a valid JSON array of strings (e.g. [\"question 1\", \"question 2\"]). "
        "Do not include any markdown formatting, code blocks, or extra text."
    )

    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant",
        )
        text = chat_completion.choices[0].message.content

        try:
            start = text.find('[')
            end = text.rfind(']') + 1
            if start != -1 and end != -1:
                json_str = text[start:end]
                questions = json.loads(json_str)
            else:
                questions = json.loads(text)
        except json.JSONDecodeError:
            questions = [line for line in text.split("\n") if line.strip()]

        return jsonify({"questions": questions})

    except Exception as e:
        print(f"Error generating questions: {e}")
        return jsonify({"error": f"AI generation failed: {str(e)}"}), 500

# -------- AI Answer Evaluation --------
@app.route("/api/evaluate-answer", methods=["POST"])
@login_required
def evaluate_answer():
    data = request.json
    question = data.get("question")
    answer = data.get("answer")
    difficulty = data.get("difficulty", "medium").lower()

    if not question or not answer:
        return jsonify({"error": "Question and answer are required"}), 400

    prompt = (
        f"You are an expert interview evaluator. Evaluate this interview answer.\n\n"
        f"Question: {question}\n"
        f"Candidate's Answer: {answer}\n\n"
        "Provide your evaluation as a valid JSON object with these fields:\n"
        '- "score": a number from 0 to 10\n'
        '- "feedback": a brief 1-2 sentence feedback on the answer quality\n'
        '- "strengths": an array of 1-2 key strengths (empty array if none)\n'
        '- "improvements": an array of 1-2 areas for improvement (empty array if none)\n\n'
        "Return ONLY the JSON object. No markdown, no code blocks, no extra text."
    )

    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant",
        )
        text = chat_completion.choices[0].message.content

        try:
            start = text.find('{')
            end = text.rfind('}') + 1
            if start != -1 and end != 0:
                evaluation = json.loads(text[start:end])
            else:
                evaluation = json.loads(text)
        except json.JSONDecodeError:
            evaluation = {
                "score": 5,
                "feedback": "Could not parse AI evaluation. Please try again.",
                "strengths": [],
                "improvements": []
            }

        # Adjust score based on difficulty
        score = float(evaluation.get("score", 5))
        if difficulty == "easy":
            score = min(10.0, score + 2.0)
        
        evaluation["score"] = round(score, 1)

        return jsonify({"evaluation": evaluation})

    except Exception as e:
        print(f"Error evaluating answer: {e}")
        return jsonify({"error": f"Evaluation failed: {str(e)}"}), 500

# -------- Save Interview Result --------
@app.route("/api/save-interview", methods=["POST"])
@login_required
def save_interview():
    data = request.json
    interview_name = data.get("interviewName")
    score = data.get("score")
    total_questions = data.get("totalQuestions")
    questions = data.get("questions")
    config = data.get("config")

    questions_json = json.dumps(questions) if questions else None
    config_json = json.dumps(config) if config else None

    conn = get_db_connection()
    conn.execute(
        "INSERT INTO interviews (user_id, interview_name, score, total_questions, questions_json, config_json) VALUES (?, ?, ?, ?, ?, ?)",
        (session["user_id"], interview_name, score, total_questions, questions_json, config_json)
    )
    conn.commit()
    conn.close()

    return jsonify({"message": "Interview result saved"})

# -------- Delete Interview --------
@app.route("/api/interviews/<int:interview_id>", methods=["DELETE"])
@login_required
def delete_interview(interview_id):
    conn = get_db_connection()
    interview = conn.execute("SELECT * FROM interviews WHERE id = ? AND user_id = ?", (interview_id, session["user_id"])).fetchone()
    if not interview:
        conn.close()
        return jsonify({"error": "Interview not found or unauthorized"}), 404
        
    conn.execute("DELETE FROM interviews WHERE id = ?", (interview_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Interview deleted successfully."})

# -------- Clear All Interviews --------
@app.route("/api/interviews/clear", methods=["POST"])
@login_required
def clear_interviews():
    conn = get_db_connection()
    conn.execute("DELETE FROM interviews WHERE user_id = ?", (session["user_id"],))
    conn.commit()
    conn.close()
    return jsonify({"message": "All interviews cleared successfully."})

# -------- Interview History --------
@app.route("/api/interview-history")
@login_required
def interview_history():
    conn = get_db_connection()
    interviews = conn.execute(
        "SELECT * FROM interviews WHERE user_id = ? ORDER BY created_at DESC",
        (session["user_id"],)
    ).fetchall()
    conn.close()

    results = []
    for i in interviews:
        item = dict(i)
        
        # Deserialize questions_json
        if item.get("questions_json"):
            try:
                item["questions"] = json.loads(item["questions_json"])
            except Exception:
                item["questions"] = []
        else:
            item["questions"] = []
            
        # Deserialize config_json
        if item.get("config_json"):
            try:
                item["config"] = json.loads(item["config_json"])
            except Exception:
                item["config"] = None
        else:
            item["config"] = None

        # Remove raw json string fields from response
        item.pop("questions_json", None)
        item.pop("config_json", None)
        results.append(item)

    return jsonify({
        "interviews": results
    })

# -------- Text to Speech --------
@app.route("/api/generate-audio", methods=["POST"])
@login_required
def generate_audio():
    data = request.json
    text = data.get("text")

    if not text:
        return jsonify({"error": "No text provided"}), 400

    eleven_labs_api_key = os.getenv("ELEVEN_LABS_API_KEY")
    if not eleven_labs_api_key:
        return jsonify({"error": "ElevenLabs API key not configured"}), 500

    voice_id = "21m00Tcm4TlvDq8ikWAM"
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"

    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": eleven_labs_api_key
    }

    payload = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.5
        }
    }

    try:
        import requests
        response = requests.post(url, json=payload, headers=headers)

        if response.status_code == 200:
            return response.content, 200, {'Content-Type': 'audio/mpeg'}
        else:
            return jsonify({"error": f"ElevenLabs API Error: {response.text}"}), response.status_code

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# -------- Admin: List Users --------
@app.route("/api/admin/users")
@admin_required
def admin_users():
    conn = get_db_connection()
    users = conn.execute("SELECT id, name, email, phone, background FROM users ORDER BY id ASC").fetchall()
    total_users = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    conn.close()
    return jsonify({
        "users": [dict(u) for u in users],
        "total_users": total_users
    })

# -------- Admin: Delete User --------
@app.route("/api/admin/users/<int:user_id>", methods=["DELETE"])
@admin_required
def delete_user(user_id):
    conn = get_db_connection()
    conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "User deleted successfully."})

# -------- Admin: Edit User --------
@app.route("/api/admin/users/<int:user_id>", methods=["PUT"])
@admin_required
def edit_user(user_id):
    data = request.json
    conn = get_db_connection()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()

    if not user:
        conn.close()
        return jsonify({"error": "User not found"}), 404

    name = data.get("name", user["name"])
    phone = data.get("phone", user["phone"])
    email = data.get("email", user["email"])
    password = data.get("password")
    background = data.get("background", user["background"])

    if password:
        password = generate_password_hash(password)
    else:
        password = user["password"]

    try:
        conn.execute("""
            UPDATE users
            SET name=?, phone=?, email=?, password=?, background=?
            WHERE id=?
        """, (name, phone, email, password, background, user_id))
        conn.commit()
        return jsonify({"message": "User updated successfully."})
    except sqlite3.IntegrityError as e:
        err = str(e).lower()
        if "phone" in err:
            return jsonify({"error": "Phone number already exists!"}), 409
        return jsonify({"error": "Email already exists!"}), 409
    finally:
        conn.close()

if __name__ == "__main__":
    app.run(debug=True)
