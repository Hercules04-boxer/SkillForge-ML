import requests

def test_audio_generation():
    # Mock login cookies (requires session simulation again, using app.test_client is better)
    from app import app
    
    with app.test_client() as client:
        with client.session_transaction() as sess:
            sess['user_id'] = 1
            sess['user_name'] = 'Test User'
            
        data = { "text": "Hello, this is a test of the ElevenLabs integration." }
        
        print("Sending TTS request...")
        response = client.post('/generate-audio', json=data)
        
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            print(f"Success! Received audio data of length: {len(response.data)} bytes")
            print(f"Content-Type: {response.content_type}")
        else:
            print(f"Error: {response.get_json()}")

if __name__ == "__main__":
    test_audio_generation()
