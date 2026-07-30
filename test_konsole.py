import os
import sys
import json
import urllib.request
import urllib.error

BASE_URL = os.getenv("KONSOLE_BASE_URL", "https://api.konsole.one/v1")
MODEL_ID = os.getenv("KONSOLE_MODEL_ID", "e30061c0dbd41052cc6f849b42e9ca8112170d9ef43ce7fde9f89faf86eee207")
API_KEY = os.getenv("KONSOLE_API_KEY", "")

def test_chat_completion(prompt="Hello from Konsole Python Client!", api_key=None):
    token = api_key or API_KEY
    if not token:
        print("⚠️ Warning: KONSOLE_API_KEY environment variable is not set.")
        token = input("Please enter your Konsole API Key: ").strip()

    url = f"{BASE_URL.rstrip('/')}/chat/completions"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}",
        "X-App-Key": token
    }
    
    payload = {
        "model": MODEL_ID,
        "messages": [
            {"role": "system", "content": "You are a helpful assistant powered by Konsole AI."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.7,
        "stream": False
    }

    req = urllib.request.Request(url, data=json.dumps(payload).encode("utf-8"), headers=headers, method="POST")

    print(f"🚀 Sending request to {url} with model {MODEL_ID}...")
    try:
        with urllib.request.urlopen(req) as response:
            res_body = response.read().decode("utf-8")
            data = json.loads(res_body)
            print("\n✅ Response Received:")
            content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
            print(content or json.dumps(data, indent=2))
    except urllib.error.HTTPError as e:
        print(f"\n❌ HTTP Error {e.code}: {e.reason}")
        print(e.read().decode("utf-8"))
    except Exception as e:
        print(f"\n❌ Request failed: {e}")

if __name__ == "__main__":
    prompt_arg = sys.argv[1] if len(sys.argv) > 1 else "Hello from Konsole Hackathon!"
    key_arg = sys.argv[2] if len(sys.argv) > 2 else None
    test_chat_completion(prompt_arg, key_arg)
