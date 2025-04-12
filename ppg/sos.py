import json
import requests
from opencage.geocoder import OpenCageGeocode
from twilio.rest import Client
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt

# === CONFIGURATION ===

# Twilio credentials
account_sid = 'AC148946daa0175af70a854cf847f5afdb'
auth_token = 'dd75b2821f9bd78f9efdb137f5e6b6bb'
twilio_number = '+16602181068'
recipient_number = '+918296015593'  # Number to notify

# OpenCage API Key
opencage_api_key = 'ba329ec2f7774c7f820d6eb7e12aed48'

# Caller details
caller_name = "John Doe"
# Remove the hardcoded heart_rate variable so we can dynamically use the provided value.

# === HELPER FUNCTIONS ===

def get_location():
    """Get approximate lat/lon via IP address."""
    try:
        res = requests.get('http://ip-api.com/json')
        data = res.json()
        return {
            'lat': data.get('lat'),
            'lon': data.get('lon'),
            'city': data.get('city'),
            'region': data.get('regionName'),
            'country': data.get('country')
        }
    except Exception as e:
        print(f"[ERROR] Could not get IP-based location: {e}")
        return None

def reverse_geocode_opencage(lat, lon):
    """Convert lat/lon into a human-readable address using OpenCage."""
    try:
        geocoder = OpenCageGeocode(opencage_api_key)
        results = geocoder.reverse_geocode(lat, lon)
        if results and len(results):
            return results[0]['formatted']
        else:
            return "Unknown location"
    except Exception as e:
        print(f"[ERROR] Reverse geocoding failed: {e}")
        return "Unknown location"

def build_message(name, location_string, heart_rate=None):
    """Creates a message for both SMS and call."""
    base_msg = f"This is an automated alert from {name}. The current location is approximately {location_string}."
    if heart_rate is not None:
        base_msg += f" The most recent heart rate recorded (from traditional PPG) is {heart_rate} BPM."
    # For a call, repeating the message 3 times might improve comprehension
    repeated_msg = " ".join([base_msg] * 3)
    return base_msg, repeated_msg

def send_sms(client, message):
    """Send SMS using Twilio."""
    sms = client.messages.create(
        body=message,
        from_=twilio_number,
        to=recipient_number
    )
    print(f"[SMS Sent] SID: {sms.sid}")
    return sms.sid

def make_call(client, message):
    """Initiate voice call with Twilio, repeating message 3 times."""
    call = client.calls.create(
        twiml=f'<Response><Say voice="alice">{message}</Say></Response>',
        from_=twilio_number,
        to=recipient_number
    )
    print(f"[Call Initiated] SID: {call.sid}")
    return call.sid

# === DJANGO VIEW ===

@csrf_exempt
def send_alert(request):
    """
    Django view that fetches location, reverse geocodes it,
    builds an alert message with the dynamic traditional PPG heart rate,
    and then sends an SMS and initiates a call.
    """
    # Attempt to retrieve the heart rate from the incoming JSON payload.
    try:
        data = json.loads(request.body)
        heart_rate = data.get('heartRate', None)
    except Exception as e:
        print(f"[ERROR] Parsing request body failed: {e}")
        heart_rate = None

    # Get location details
    location = get_location()
    if not location:
        return JsonResponse({"error": "Could not retrieve location."}, status=400)

    # Get human-readable address using latitude and longitude from IP
    address = reverse_geocode_opencage(location['lat'], location['lon'])

    # Build the SMS and call messages using the dynamic heart rate value
    sms_msg, call_msg = build_message(caller_name, address, heart_rate)

    # Initialize Twilio Client
    client = Client(account_sid, auth_token)

    # Send alerts
    try:
        sms_sid = send_sms(client, sms_msg)
        call_sid = make_call(client, call_msg)
    except Exception as e:
        return JsonResponse({"error": f"Alert sending failed: {str(e)}"}, status=500)

    # Return a success response (you can customize the return value/template)
    return HttpResponse(f"Alerts sent successfully! SMS SID: {sms_sid}, Call SID: {call_sid}")
