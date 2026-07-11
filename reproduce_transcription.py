import requests
import os

def test_transcription():
    # Create a dummy WebM file (just some bytes, might be invalid video but should trigger API response)
    filename = "test_transcription.webm"
    with open(filename, "wb") as f:
        f.write(b"\x1a\x45\xdf\xa3" * 100) # Simple EBML header-ish junk
        
    from app import app
    
    with app.test_client() as client:
        with client.session_transaction() as sess:
            sess['user_id'] = 1
            sess['user_name'] = 'Test User'
            
        data = {
            'audio': (open(filename, "rb"), filename)
        }
        
        print("Uploading file for transcription...")
        response = client.post('/upload_audio', data=data, content_type='multipart/form-data')
        
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.get_json()}")
        
    # Cleanup
    if os.path.exists(filename):
        os.remove(filename)

if __name__ == "__main__":
    test_transcription()
