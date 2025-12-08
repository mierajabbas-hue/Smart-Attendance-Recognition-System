#!/usr/bin/env python3
"""
Test script to verify user creation endpoint works
"""
import requests
import os

# First login to get token
login_url = "http://localhost:8000/api/v1/auth/login"
login_data = {
    "username": "admin",
    "password": "admin123"
}

print("Logging in...")
response = requests.post(login_url, data=login_data)
if response.status_code != 200:
    print(f"Login failed: {response.status_code}")
    print(response.text)
    exit(1)

token = response.json()["access_token"]
print(f"Login successful! Token: {token[:20]}...")

# Now try to create a user
create_url = "http://localhost:8000/api/v1/users/"
headers = {
    "Authorization": f"Bearer {token}"
}

# Create a dummy image file
dummy_image_path = "/tmp/test_photo.jpg"
with open(dummy_image_path, "wb") as f:
    # Create a minimal valid JPEG file
    f.write(bytes.fromhex('FFD8FFE000104A46494600010100000100010000FFDB0043000302020302020303030304030304050805050404050A070706080C0A0C0C0B0A0B0B0D0E12100D0E110E0B0B1016101113141515150C0F171816141812141514FFD9'))

files = {
    "photo": open(dummy_image_path, "rb")
}

data = {
    "user_id": "TEST123",
    "name": "Test Student",
    "role": "student",
    "email": "test@example.com",
    "department": "Computer Science"
}

print("\nAttempting to create user...")
response = requests.post(create_url, headers=headers, data=data, files=files)

print(f"Status Code: {response.status_code}")
print(f"Response: {response.text}")

# Cleanup
os.remove(dummy_image_path)

if response.status_code == 201:
    print("\n✓ User creation SUCCESSFUL!")
else:
    print(f"\n✗ User creation FAILED!")
