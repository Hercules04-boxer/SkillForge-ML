from app import app
import time

def test_generate_questions():
    with app.test_client() as client:
        # Simulate login by setting session
        with client.session_transaction() as sess:
            sess['user_id'] = 1
            sess['user_name'] = 'Test User'
            sess['user_email'] = 'test@test.com'
        
        data = {
            "interviewName": "Flask Developer",
            "objectives": "REST API, Routing",
            "numQs": 2
        }
        
        print("Sending request to Groq...")
        start = time.time()
        response = client.post('/generate-questions', json=data)
        print(f"Time taken: {time.time() - start:.2f}s")
        print(f"Status Code: {response.status_code}")
        print(f"Response Body: {response.get_json()}")

if __name__ == "__main__":
    test_generate_questions()
