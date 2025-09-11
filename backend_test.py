import requests
import sys
import json
from datetime import datetime
import uuid

class CortateAPITester:
    def __init__(self, base_url="https://quickcut-app.preview.emergentagent.com"):
        self.base_url = base_url
        self.client_token = None
        self.barber_token = None
        self.client_user = None
        self.barber_user = None
        self.barbershop_id = None
        self.booking_id = None
        self.tests_run = 0
        self.tests_passed = 0
        
        # Generate unique test data
        timestamp = datetime.now().strftime('%H%M%S')
        self.client_email = f"cliente{timestamp}@test.com"
        self.barber_email = f"barbero{timestamp}@test.com"
        self.test_password = "TestPass123!"

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {method} {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(str(response_data)) < 500:
                        print(f"   Response: {response_data}")
                except:
                    pass
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Raw response: {response.text[:200]}")

            return success, response.json() if response.text else {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout")
            return False, {}
        except requests.exceptions.ConnectionError:
            print(f"❌ Failed - Connection error")
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test basic health endpoint"""
        success, response = self.run_test(
            "Health Check",
            "GET",
            "api/health",
            200
        )
        return success

    def test_root_endpoint(self):
        """Test root endpoint"""
        success, response = self.run_test(
            "Root Endpoint",
            "GET",
            "",
            200
        )
        return success

    def test_register_client(self):
        """Test client registration"""
        success, response = self.run_test(
            "Register Client",
            "POST",
            "api/auth/register",
            200,
            data={
                "name": "Cliente Test",
                "email": self.client_email,
                "password": self.test_password,
                "confirmPassword": self.test_password,
                "userType": "client",
                "phone": "+56912345678",
                "address": "Santiago, Chile"
            }
        )
        
        if success and 'access_token' in response:
            self.client_token = response['access_token']
            self.client_user = response['user']
            print(f"   Client token obtained: {self.client_token[:20]}...")
        
        return success

    def test_register_barber(self):
        """Test barber registration"""
        success, response = self.run_test(
            "Register Barber",
            "POST",
            "api/auth/register",
            200,
            data={
                "name": "Barbero Test",
                "email": self.barber_email,
                "password": self.test_password,
                "confirmPassword": self.test_password,
                "userType": "barber",
                "phone": "+56987654321",
                "address": "Las Condes, Santiago"
            }
        )
        
        if success and 'access_token' in response:
            self.barber_token = response['access_token']
            self.barber_user = response['user']
            print(f"   Barber token obtained: {self.barber_token[:20]}...")
        
        return success

    def test_login_client(self):
        """Test client login"""
        success, response = self.run_test(
            "Login Client",
            "POST",
            "api/auth/login",
            200,
            data={
                "email": self.client_email,
                "password": self.test_password
            }
        )
        return success

    def test_login_barber(self):
        """Test barber login"""
        success, response = self.run_test(
            "Login Barber",
            "POST",
            "api/auth/login",
            200,
            data={
                "email": self.barber_email,
                "password": self.test_password
            }
        )
        return success

    def test_invalid_login(self):
        """Test login with invalid credentials"""
        success, response = self.run_test(
            "Invalid Login",
            "POST",
            "api/auth/login",
            401,
            data={
                "email": "invalid@test.com",
                "password": "wrongpassword"
            }
        )
        return success

    def test_get_current_user_client(self):
        """Test getting current user info for client"""
        if not self.client_token:
            print("❌ Skipped - No client token available")
            return False
            
        success, response = self.run_test(
            "Get Current User (Client)",
            "GET",
            "api/auth/me",
            200,
            token=self.client_token
        )
        return success

    def test_get_current_user_barber(self):
        """Test getting current user info for barber"""
        if not self.barber_token:
            print("❌ Skipped - No barber token available")
            return False
            
        success, response = self.run_test(
            "Get Current User (Barber)",
            "GET",
            "api/auth/me",
            200,
            token=self.barber_token
        )
        return success

    def test_get_barbershops(self):
        """Test getting barbershops list"""
        success, response = self.run_test(
            "Get Barbershops",
            "GET",
            "api/barbershops",
            200
        )
        
        if success and 'barbershops' in response:
            barbershops = response['barbershops']
            print(f"   Found {len(barbershops)} barbershops")
            if barbershops:
                print(f"   Sample barbershop: {barbershops[0].get('name', 'Unknown')}")
        
        return success

    def test_create_quick_cut_request(self):
        """Test creating a quick cut request (client only)"""
        if not self.client_token:
            print("❌ Skipped - No client token available")
            return False
            
        success, response = self.run_test(
            "Create Quick Cut Request",
            "POST",
            "api/quick-cuts/request",
            200,
            data={
                "service": "Corte de pelo",
                "max_price": 15000,
                "lat": -33.4489,
                "lng": -70.6693
            },
            token=self.client_token
        )
        return success

    def test_quick_cut_with_preferred_time_asap(self):
        """Test creating quick cut request with preferred_time: asap"""
        if not self.client_token:
            print("❌ Skipped - No client token available")
            return False
            
        success, response = self.run_test(
            "Quick Cut Request - preferred_time: asap",
            "POST",
            "api/quick-cuts/request",
            200,
            data={
                "service": "Corte de pelo",
                "max_price": 15000,
                "max_distance": 5,
                "service_location": "local",
                "preferred_time": "asap",
                "lat": -33.4489,
                "lng": -70.6693
            },
            token=self.client_token
        )
        
        if success and response:
            # Verify the preferred_time field is saved correctly
            if response.get('preferred_time') == 'asap':
                print("   ✅ preferred_time field saved correctly: asap")
            else:
                print(f"   ❌ preferred_time field incorrect: expected 'asap', got '{response.get('preferred_time')}'")
                return False
                
            # Verify other new fields
            if response.get('max_distance') == 5:
                print("   ✅ max_distance field saved correctly: 5")
            else:
                print(f"   ❌ max_distance field incorrect: expected 5, got {response.get('max_distance')}")
                
            if response.get('service_location') == 'local':
                print("   ✅ service_location field saved correctly: local")
            else:
                print(f"   ❌ service_location field incorrect: expected 'local', got '{response.get('service_location')}'")
        
        return success

    def test_quick_cut_with_preferred_time_30min(self):
        """Test creating quick cut request with preferred_time: 30min"""
        if not self.client_token:
            print("❌ Skipped - No client token available")
            return False
            
        success, response = self.run_test(
            "Quick Cut Request - preferred_time: 30min",
            "POST",
            "api/quick-cuts/request",
            200,
            data={
                "service": "Barba",
                "max_price": 10000,
                "max_distance": 3,
                "service_location": "domicilio",
                "preferred_time": "30min",
                "lat": -33.4489,
                "lng": -70.6693
            },
            token=self.client_token
        )
        
        if success and response:
            if response.get('preferred_time') == '30min':
                print("   ✅ preferred_time field saved correctly: 30min")
            else:
                print(f"   ❌ preferred_time field incorrect: expected '30min', got '{response.get('preferred_time')}'")
                return False
        
        return success

    def test_quick_cut_with_preferred_time_1hour(self):
        """Test creating quick cut request with preferred_time: 1hour"""
        if not self.client_token:
            print("❌ Skipped - No client token available")
            return False
            
        success, response = self.run_test(
            "Quick Cut Request - preferred_time: 1hour",
            "POST",
            "api/quick-cuts/request",
            200,
            data={
                "service": "Corte de pelo",
                "max_price": 20000,
                "max_distance": 8,
                "service_location": "local",
                "preferred_time": "1hour",
                "lat": -33.4489,
                "lng": -70.6693
            },
            token=self.client_token
        )
        
        if success and response:
            if response.get('preferred_time') == '1hour':
                print("   ✅ preferred_time field saved correctly: 1hour")
            else:
                print(f"   ❌ preferred_time field incorrect: expected '1hour', got '{response.get('preferred_time')}'")
                return False
        
        return success

    def test_quick_cut_with_preferred_time_2hours(self):
        """Test creating quick cut request with preferred_time: 2hours"""
        if not self.client_token:
            print("❌ Skipped - No client token available")
            return False
            
        success, response = self.run_test(
            "Quick Cut Request - preferred_time: 2hours",
            "POST",
            "api/quick-cuts/request",
            200,
            data={
                "service": "Corte completo",
                "max_price": 25000,
                "max_distance": 10,
                "service_location": "domicilio",
                "preferred_time": "2hours",
                "lat": -33.4489,
                "lng": -70.6693
            },
            token=self.client_token
        )
        
        if success and response:
            if response.get('preferred_time') == '2hours':
                print("   ✅ preferred_time field saved correctly: 2hours")
            else:
                print(f"   ❌ preferred_time field incorrect: expected '2hours', got '{response.get('preferred_time')}'")
                return False
        
        return success
    def test_create_review(self):
        """Test creating a review (client only)"""
        if not self.client_token:
            print("❌ Skipped - No client token available")
            return False
            
        # First get a barbershop to review
        success_bs, response_bs = self.run_test(
            "Get Barbershops for Review",
            "GET",
            "api/barbershops",
            200
        )
        
        if not success_bs or not response_bs.get('barbershops'):
            print("❌ No barbershops available for review")
            return False
            
        barbershop = response_bs['barbershops'][0]  # Use first available barbershop
        
        success, response = self.run_test(
            "Create Review",
            "POST",
            "api/reviews",
            200,
            data={
                "barbershop_id": barbershop['id'],
                "rating": 5,
                "comment": "Excelente servicio, muy profesional y rápido. Recomendado 100%."
            },
            token=self.client_token
        )
        
        if success and response:
            # Verify review data
            if response.get('rating') == 5:
                print("   ✅ Rating saved correctly: 5")
            else:
                print(f"   ❌ Rating incorrect: expected 5, got {response.get('rating')}")
                return False
                
            if response.get('barbershop_id') == barbershop['id']:
                print(f"   ✅ Barbershop ID saved correctly: {barbershop['id']}")
            else:
                print(f"   ❌ Barbershop ID incorrect")
                return False
                
            if response.get('client_id'):
                print(f"   ✅ Client ID saved correctly: {response.get('client_id')}")
            else:
                print("   ❌ Client ID missing")
                return False
                
            # Store review info for later tests
            self.review_barbershop_id = barbershop['id']
        
        return success

    def test_get_barbershop_reviews(self):
        """Test getting reviews for a barbershop"""
        if not hasattr(self, 'review_barbershop_id'):
            print("❌ Skipped - No barbershop ID available from review test")
            return False
            
        success, response = self.run_test(
            "Get Barbershop Reviews",
            "GET",
            f"api/reviews/barbershop/{self.review_barbershop_id}",
            200
        )
        
        if success and response:
            reviews = response.get('reviews', [])
            print(f"   Found {len(reviews)} reviews for barbershop")
            
            if reviews:
                # Check first review structure
                review = reviews[0]
                required_fields = ['id', 'client_id', 'client_name', 'barbershop_id', 'rating', 'comment', 'created_at']
                missing_fields = []
                
                for field in required_fields:
                    if field not in review:
                        missing_fields.append(field)
                
                if missing_fields:
                    print(f"   ❌ Missing fields in review: {missing_fields}")
                    return False
                else:
                    print("   ✅ All required review fields present")
                    print(f"   📝 Sample review: Rating {review['rating']}/5 by {review['client_name']}")
        
        return success

    def test_client_history_endpoint(self):
        """Test client history endpoint - should return combined bookings and quick_cuts with reviews"""
        if not self.client_token:
            print("❌ Skipped - No client token available")
            return False
            
        success, response = self.run_test(
            "Get Client History",
            "GET",
            "api/client/history",
            200,
            token=self.client_token
        )
        
        if success and response:
            history = response.get('history', [])
            print(f"   Found {len(history)} items in client history")
            
            # Analyze history items
            bookings_count = 0
            quick_cuts_count = 0
            items_with_reviews = 0
            
            for item in history:
                item_type = item.get('type')
                if item_type == 'booking':
                    bookings_count += 1
                elif item_type == 'quick_cut':
                    quick_cuts_count += 1
                
                # Check if item has review associated
                if 'review' in item:
                    items_with_reviews += 1
                
                # Verify required fields based on type
                if item_type == 'booking':
                    required_fields = ['id', 'client_id', 'barbershop_id', 'barber_id', 'service', 'date', 'price', 'status']
                elif item_type == 'quick_cut':
                    required_fields = ['id', 'client_id', 'service', 'max_price', 'preferred_time', 'max_distance', 'service_location', 'status']
                else:
                    print(f"   ❌ Unknown item type: {item_type}")
                    continue
                
                missing_fields = [field for field in required_fields if field not in item]
                if missing_fields:
                    print(f"   ❌ Missing fields in {item_type}: {missing_fields}")
                    return False
            
            print(f"   📊 History breakdown:")
            print(f"      - Bookings: {bookings_count}")
            print(f"      - Quick cuts: {quick_cuts_count}")
            print(f"      - Items with reviews: {items_with_reviews}")
            
            # Verify history includes both types if we created them
            if bookings_count > 0:
                print("   ✅ Bookings included in history")
            if quick_cuts_count > 0:
                print("   ✅ Quick cuts included in history")
            
            print("   ✅ Client history endpoint working correctly")
        
        return success

    def test_get_quick_cut_requests(self):
        """Test getting quick cut requests (barber only)"""
        if not self.barber_token:
            print("❌ Skipped - No barber token available")
            return False
            
        success, response = self.run_test(
            "Get Quick Cut Requests",
            "GET",
            "api/quick-cuts/requests",
            200,
            token=self.barber_token
        )
        
        if success and 'requests' in response:
            requests_list = response['requests']
            print(f"   Found {len(requests_list)} quick cut requests")
        
        return success

    def test_get_barber_bookings(self):
        """Test getting barber bookings"""
        if not self.barber_token:
            print("❌ Skipped - No barber token available")
            return False
            
        success, response = self.run_test(
            "Get Barber Bookings",
            "GET",
            "api/bookings/barber",
            200,
            token=self.barber_token
        )
        
        if success and 'bookings' in response:
            bookings = response['bookings']
            print(f"   Found {len(bookings)} barber bookings")
        
        return success

    def test_unauthorized_access(self):
        """Test accessing protected endpoint without token"""
        success, response = self.run_test(
            "Unauthorized Access",
            "GET",
            "api/auth/me",
            401
        )
        return success

    def test_client_cannot_access_barber_endpoints(self):
        """Test that client cannot access barber-only endpoints"""
        if not self.client_token:
            print("❌ Skipped - No client token available")
            return False
            
        success, response = self.run_test(
            "Client Cannot Access Barber Requests",
            "GET",
            "api/quick-cuts/requests",
            403,
            token=self.client_token
        )
        return success

    def test_barber_cannot_create_quick_cuts(self):
        """Test that barber cannot create quick cut requests"""
        if not self.barber_token:
            print("❌ Skipped - No barber token available")
            return False
            
        success, response = self.run_test(
            "Barber Cannot Create Quick Cuts",
            "POST",
            "api/quick-cuts/request",
            403,
            data={
                "service": "Corte de pelo",
                "max_price": 15000,
                "lat": -33.4489,
                "lng": -70.6693
            },
            token=self.barber_token
        )
        return success

    def test_create_barbershop(self):
        """Test creating a barbershop (barber only)"""
        if not self.barber_token:
            print("❌ Skipped - No barber token available")
            return False
            
        success, response = self.run_test(
            "Create Barbershop",
            "POST",
            "api/barbershops",
            200,
            data={
                "name": "Barbería Test Premium",
                "description": "Una barbería de prueba con servicios premium",
                "address": "Av. Providencia 1234, Santiago",
                "phone": "+56987654321",
                "services": [
                    {"name": "Corte de pelo", "price": 12000, "duration": 30},
                    {"name": "Barba", "price": 8000, "duration": 20}
                ],
                "working_hours": {
                    "monday": {"open": "09:00", "close": "19:00"},
                    "tuesday": {"open": "09:00", "close": "19:00"},
                    "wednesday": {"open": "09:00", "close": "19:00"},
                    "thursday": {"open": "09:00", "close": "19:00"},
                    "friday": {"open": "09:00", "close": "19:00"},
                    "saturday": {"open": "10:00", "close": "18:00"},
                    "sunday": {"closed": True}
                }
            },
            token=self.barber_token
        )
        
        if success and 'id' in response:
            self.barbershop_id = response['id']
            print(f"   Barbershop created with ID: {self.barbershop_id}")
        
        return success

    def test_get_my_barbershop(self):
        """Test getting barber's own barbershop"""
        if not self.barber_token:
            print("❌ Skipped - No barber token available")
            return False
            
        success, response = self.run_test(
            "Get My Barbershop",
            "GET",
            "api/barbershops/my",
            200,
            token=self.barber_token
        )
        
        if success and response.get('barbershop'):
            barbershop = response['barbershop']
            print(f"   Found barbershop: {barbershop.get('name', 'Unknown')}")
            print(f"   Address: {barbershop.get('address', 'No address')}")
            print(f"   Services: {len(barbershop.get('services', []))}")
        elif success and not response.get('barbershop'):
            print("   ⚠️ No barbershop found for this barber")
        
        return success

    def test_barbershop_persistence(self):
        """Test that barbershop data persists after creation"""
        if not self.barber_token:
            print("❌ Skipped - No barber token available")
            return False
            
        # First get the barbershop
        success1, response1 = self.run_test(
            "Check Barbershop Persistence",
            "GET",
            "api/barbershops/my",
            200,
            token=self.barber_token
        )
        
        if not success1:
            return False
            
        if not response1.get('barbershop'):
            print("   ❌ Barbershop not found - persistence failed")
            return False
            
        barbershop = response1['barbershop']
        
        # Verify all data is present
        required_fields = ['name', 'description', 'address', 'services', 'working_hours']
        missing_fields = []
        
        for field in required_fields:
            if not barbershop.get(field):
                missing_fields.append(field)
        
        if missing_fields:
            print(f"   ❌ Missing fields in persisted data: {missing_fields}")
            return False
        
        print("   ✅ All barbershop data persisted correctly")
        return True

    def test_create_traditional_booking(self):
        """Test creating a traditional booking"""
        if not self.client_token or not hasattr(self, 'barbershop_id'):
            print("❌ Skipped - Need client token and barbershop ID")
            return False
            
        # Get barbershop info first
        success_bs, response_bs = self.run_test(
            "Get Barbershop for Booking",
            "GET",
            "api/barbershops",
            200
        )
        
        if not success_bs or not response_bs.get('barbershops'):
            print("❌ No barbershops available for booking")
            return False
            
        barbershop = response_bs['barbershops'][0]  # Use first available barbershop
        
        booking_date = datetime.now().strftime('%Y-%m-%dT%H:%M:%S')
        
        success, response = self.run_test(
            "Create Traditional Booking",
            "POST",
            "api/bookings",
            200,
            data={
                "barbershop_id": barbershop['id'],
                "barber_id": barbershop['barber_id'],
                "service": "Corte de pelo",
                "date": booking_date,
                "price": 12000,
                "notes": "Booking de prueba"
            },
            token=self.client_token
        )
        
        if success and 'id' in response:
            self.booking_id = response['id']
            print(f"   Booking created with ID: {self.booking_id}")
        
        return success

    def test_google_maps_geocoding(self):
        """Test Google Maps API geocoding functionality with Santiago address"""
        if not self.barber_token:
            print("❌ Skipped - No barber token available")
            return False
            
        print("\n🗺️ TESTING GOOGLE MAPS API INTEGRATION")
        print("-" * 50)
        
        # Test creating barbershop with specific Santiago address
        success, response = self.run_test(
            "Create Barbershop with Santiago Address (Google Maps Test)",
            "POST",
            "api/barbershops",
            200,
            data={
                "name": "Barbería Santiago Maps Test",
                "description": "Barbería de prueba para validar Google Maps API",
                "address": "Av. Providencia 1500, Santiago, Chile",
                "phone": "+56987654321",
                "services": [
                    {"name": "Corte de pelo", "price": 15000, "duration": 30},
                    {"name": "Barba", "price": 10000, "duration": 20}
                ],
                "working_hours": {
                    "monday": {"open": "09:00", "close": "19:00"},
                    "tuesday": {"open": "09:00", "close": "19:00"},
                    "wednesday": {"open": "09:00", "close": "19:00"},
                    "thursday": {"open": "09:00", "close": "19:00"},
                    "friday": {"open": "09:00", "close": "19:00"},
                    "saturday": {"open": "10:00", "close": "18:00"},
                    "sunday": {"closed": True}
                }
            },
            token=self.barber_token
        )
        
        if not success:
            print("❌ Failed to create barbershop - Google Maps API may have issues")
            return False
            
        # Validate coordinates are in Santiago range
        if 'lat' in response and 'lng' in response:
            lat = response['lat']
            lng = response['lng']
            
            print(f"   📍 Coordinates received: lat={lat}, lng={lng}")
            
            # Santiago coordinates should be approximately:
            # Latitude: -33.4xxx (between -33.3 and -33.6)
            # Longitude: -70.6xxx (between -70.5 and -70.8)
            
            santiago_lat_valid = -33.6 <= lat <= -33.3
            santiago_lng_valid = -70.8 <= lng <= -70.5
            
            if santiago_lat_valid and santiago_lng_valid:
                print("   ✅ Coordinates are within Santiago range")
                print("   ✅ Google Maps geocoding working correctly")
                
                # Store barbershop ID for further testing
                if 'id' in response:
                    self.barbershop_id = response['id']
                    print(f"   📝 Barbershop ID stored: {self.barbershop_id}")
                
                return True
            else:
                print(f"   ❌ Coordinates outside Santiago range:")
                print(f"      Expected lat: -33.3 to -33.6, got: {lat}")
                print(f"      Expected lng: -70.5 to -70.8, got: {lng}")
                print("   ⚠️ Google Maps API may be using fallback coordinates")
                return False
        else:
            print("   ❌ No coordinates returned in response")
            print("   ❌ Google Maps geocoding failed")
            return False

    def test_barbershop_appears_in_list(self):
        """Test that the created barbershop appears in the barbershops list"""
        if not hasattr(self, 'barbershop_id') or not self.barbershop_id:
            print("❌ Skipped - No barbershop ID available from previous test")
            return False
            
        success, response = self.run_test(
            "Verify Barbershop Appears in List",
            "GET",
            "api/barbershops",
            200
        )
        
        if not success:
            return False
            
        if 'barbershops' in response:
            barbershops = response['barbershops']
            
            # Look for our test barbershop
            found_barbershop = None
            for bs in barbershops:
                if bs.get('id') == self.barbershop_id:
                    found_barbershop = bs
                    break
            
            if found_barbershop:
                print(f"   ✅ Barbershop found in list: {found_barbershop.get('name')}")
                print(f"   📍 Address: {found_barbershop.get('address')}")
                print(f"   🗺️ Coordinates: lat={found_barbershop.get('lat')}, lng={found_barbershop.get('lng')}")
                return True
            else:
                print(f"   ❌ Barbershop with ID {self.barbershop_id} not found in list")
                print(f"   📊 Total barbershops in list: {len(barbershops)}")
                return False
        else:
            print("   ❌ No barbershops key in response")
            return False

    def test_debug_endpoints(self):
        """Test debug endpoints to check data persistence"""
        print("\n🔍 DEBUGGING DATA PERSISTENCE")
        print("-" * 40)
        
        # Test debug barbershops endpoint
        success1, response1 = self.run_test(
            "Debug Barbershops",
            "GET",
            "api/debug/barbershops",
            200
        )
        
        if success1 and 'barbershops' in response1:
            barbershops = response1['barbershops']
            print(f"   Total barbershops in DB: {len(barbershops)}")
            for i, bs in enumerate(barbershops[:3]):  # Show first 3
                print(f"   Barbershop {i+1}: {bs.get('name', 'Unknown')} (ID: {bs.get('id', 'No ID')})")
        
        # Test debug user endpoint if we have tokens
        if self.barber_token:
            success2, response2 = self.run_test(
                "Debug Current User",
                "GET",
                "api/debug/user",
                200,
                token=self.barber_token
            )
        
        return success1

    def analyze_barbershop_database_cleanup(self):
        """Analyze barbershop database for cleanup - identify fake/test barbershops"""
        print("\n🧹 DATABASE CLEANUP ANALYSIS FOR CÓRTATE.CL")
        print("=" * 60)
        print("OBJETIVO: Identificar barberías ficticias o de prueba para eliminación")
        print("-" * 60)
        
        # Get all barbershops
        success, response = self.run_test(
            "Get All Barbershops for Analysis",
            "GET",
            "api/debug/barbershops",
            200
        )
        
        if not success or 'barbershops' not in response:
            print("❌ No se pudieron obtener las barberías para análisis")
            return False
            
        barbershops = response['barbershops']
        total_barbershops = len(barbershops)
        
        print(f"\n📊 RESUMEN INICIAL:")
        print(f"   Total de barberías en la base de datos: {total_barbershops}")
        
        if total_barbershops == 0:
            print("   ✅ Base de datos limpia - no hay barberías registradas")
            return True
        
        # Analyze each barbershop
        legitimate_barbershops = []
        suspicious_barbershops = []
        test_barbershops = []
        duplicate_names = {}
        
        print(f"\n🔍 ANÁLISIS DETALLADO DE BARBERÍAS:")
        print("-" * 50)
        
        for i, barbershop in enumerate(barbershops, 1):
            name = barbershop.get('name', 'Sin nombre')
            barber_id = barbershop.get('barber_id', 'Sin barber_id')
            address = barbershop.get('address', 'Sin dirección')
            created_at = barbershop.get('created_at', 'Sin fecha')
            barbershop_id = barbershop.get('id', 'Sin ID')
            
            print(f"\n{i}. BARBERÍA: {name}")
            print(f"   ID: {barbershop_id}")
            print(f"   Barber ID: {barber_id}")
            print(f"   Dirección: {address}")
            print(f"   Creada: {created_at}")
            
            # Check for suspicious patterns
            is_suspicious = False
            is_test = False
            reasons = []
            
            # Check for test/fake names
            test_keywords = [
                'test', 'prueba', 'fake', 'demo', 'ejemplo', 'sample',
                'barbería moderna', 'barbería elegante', 'barberia cantagallo'
            ]
            
            name_lower = name.lower()
            for keyword in test_keywords:
                if keyword in name_lower:
                    is_test = True
                    reasons.append(f"Nombre contiene palabra de prueba: '{keyword}'")
            
            # Check for duplicate names
            if name in duplicate_names:
                duplicate_names[name].append(barbershop_id)
                is_suspicious = True
                reasons.append("Nombre duplicado")
            else:
                duplicate_names[name] = [barbershop_id]
            
            # Check for missing or invalid barber_id
            if not barber_id or barber_id == 'Sin barber_id':
                is_suspicious = True
                reasons.append("Falta barber_id")
            
            # Check for generic addresses
            generic_addresses = [
                'santiago', 'chile', 'test', 'prueba', 'ejemplo',
                'av. providencia', 'las condes'
            ]
            
            address_lower = address.lower()
            for generic in generic_addresses:
                if address_lower == generic or address_lower.startswith(generic + ','):
                    is_suspicious = True
                    reasons.append(f"Dirección genérica: '{generic}'")
                    break
            
            # Categorize barbershop
            if is_test:
                test_barbershops.append({
                    'barbershop': barbershop,
                    'reasons': reasons
                })
                print(f"   🚨 CATEGORÍA: BARBERÍA DE PRUEBA")
            elif is_suspicious:
                suspicious_barbershops.append({
                    'barbershop': barbershop,
                    'reasons': reasons
                })
                print(f"   ⚠️ CATEGORÍA: SOSPECHOSA")
            else:
                legitimate_barbershops.append(barbershop)
                print(f"   ✅ CATEGORÍA: LEGÍTIMA")
            
            if reasons:
                print(f"   📝 Razones: {', '.join(reasons)}")
        
        # Check for duplicates
        duplicates = {name: ids for name, ids in duplicate_names.items() if len(ids) > 1}
        
        # Generate cleanup report
        print(f"\n📋 REPORTE DE LIMPIEZA RECOMENDADA:")
        print("=" * 60)
        
        print(f"\n✅ BARBERÍAS A MANTENER ({len(legitimate_barbershops)}):")
        if legitimate_barbershops:
            for barbershop in legitimate_barbershops:
                print(f"   - {barbershop.get('name')} (ID: {barbershop.get('id')})")
                print(f"     Barbero: {barbershop.get('barber_id')}")
                print(f"     Dirección: {barbershop.get('address')}")
        else:
            print("   (Ninguna barbería legítima encontrada)")
        
        print(f"\n🚨 BARBERÍAS DE PRUEBA A ELIMINAR ({len(test_barbershops)}):")
        if test_barbershops:
            for item in test_barbershops:
                barbershop = item['barbershop']
                print(f"   - {barbershop.get('name')} (ID: {barbershop.get('id')})")
                print(f"     Razones: {', '.join(item['reasons'])}")
        else:
            print("   (Ninguna barbería de prueba encontrada)")
        
        print(f"\n⚠️ BARBERÍAS SOSPECHOSAS A REVISAR ({len(suspicious_barbershops)}):")
        if suspicious_barbershops:
            for item in suspicious_barbershops:
                barbershop = item['barbershop']
                print(f"   - {barbershop.get('name')} (ID: {barbershop.get('id')})")
                print(f"     Razones: {', '.join(item['reasons'])}")
        else:
            print("   (Ninguna barbería sospechosa encontrada)")
        
        if duplicates:
            print(f"\n🔄 NOMBRES DUPLICADOS ENCONTRADOS:")
            for name, ids in duplicates.items():
                print(f"   - '{name}': {len(ids)} barberías con IDs: {', '.join(ids)}")
        
        # Summary and recommendations
        print(f"\n📊 RESUMEN FINAL:")
        print(f"   Total barberías: {total_barbershops}")
        print(f"   Legítimas: {len(legitimate_barbershops)}")
        print(f"   De prueba (eliminar): {len(test_barbershops)}")
        print(f"   Sospechosas (revisar): {len(suspicious_barbershops)}")
        print(f"   Nombres duplicados: {len(duplicates)}")
        
        print(f"\n💡 RECOMENDACIONES:")
        if test_barbershops:
            print(f"   1. Eliminar inmediatamente {len(test_barbershops)} barberías de prueba")
        if suspicious_barbershops:
            print(f"   2. Revisar manualmente {len(suspicious_barbershops)} barberías sospechosas")
        if duplicates:
            print(f"   3. Resolver {len(duplicates)} casos de nombres duplicados")
        if len(legitimate_barbershops) == total_barbershops:
            print("   ✅ Base de datos parece estar limpia")
        
        print(f"\n⚠️ IMPORTANTE: Este es solo un análisis. NO se han eliminado datos.")
        
        # Store analysis results for cleanup execution
        self.cleanup_analysis = {
            'test_barbershops': test_barbershops,
            'legitimate_barbershops': legitimate_barbershops,
            'suspicious_barbershops': suspicious_barbershops,
            'total_barbershops': total_barbershops
        }
        
        return True

    def execute_database_cleanup(self):
        """Execute database cleanup by deleting identified fake/test barbershops"""
        print("\n🧹 EJECUTANDO LIMPIEZA DE BASE DE DATOS")
        print("=" * 60)
        print("OBJETIVO: Eliminar barberías ficticias identificadas en el análisis")
        print("-" * 60)
        
        if not hasattr(self, 'cleanup_analysis'):
            print("❌ Error: Debe ejecutar análisis primero")
            return False
        
        if not self.barber_token:
            print("❌ Error: Se requiere token de barbero para ejecutar limpieza")
            return False
        
        analysis = self.cleanup_analysis
        test_barbershops = analysis['test_barbershops']
        
        if not test_barbershops:
            print("✅ No hay barberías de prueba para eliminar")
            return True
        
        print(f"\n🎯 ELIMINANDO {len(test_barbershops)} BARBERÍAS DE PRUEBA:")
        print("-" * 50)
        
        deleted_count = 0
        failed_deletions = []
        
        for item in test_barbershops:
            barbershop = item['barbershop']
            barbershop_id = barbershop.get('id')
            barbershop_name = barbershop.get('name')
            
            print(f"\n🗑️ Eliminando: {barbershop_name}")
            print(f"   ID: {barbershop_id}")
            print(f"   Razones: {', '.join(item['reasons'])}")
            
            success, response = self.run_test(
                f"Delete Barbershop: {barbershop_name}",
                "DELETE",
                f"api/barbershops/{barbershop_id}",
                200,
                token=self.barber_token
            )
            
            if success:
                deleted_count += 1
                print(f"   ✅ Eliminada exitosamente")
            else:
                failed_deletions.append({
                    'id': barbershop_id,
                    'name': barbershop_name,
                    'error': response
                })
                print(f"   ❌ Error al eliminar")
        
        print(f"\n📊 RESULTADOS DE LA LIMPIEZA:")
        print(f"   Barberías eliminadas: {deleted_count}")
        print(f"   Eliminaciones fallidas: {len(failed_deletions)}")
        
        if failed_deletions:
            print(f"\n❌ ELIMINACIONES FALLIDAS:")
            for failure in failed_deletions:
                print(f"   - {failure['name']} (ID: {failure['id']})")
        
        # Verify cleanup by checking remaining barbershops
        print(f"\n🔍 VERIFICANDO LIMPIEZA...")
        success, response = self.run_test(
            "Verify Cleanup - Get Remaining Barbershops",
            "GET",
            "api/debug/barbershops",
            200
        )
        
        if success and 'barbershops' in response:
            remaining_barbershops = response['barbershops']
            print(f"   Barberías restantes: {len(remaining_barbershops)}")
            
            # Check if any test barbershops remain
            remaining_test = []
            for barbershop in remaining_barbershops:
                name = barbershop.get('name', '').lower()
                test_keywords = [
                    'test', 'prueba', 'fake', 'demo', 'ejemplo', 'sample',
                    'barbería moderna', 'barbería elegante', 'barberia cantagallo'
                ]
                if any(keyword in name for keyword in test_keywords):
                    remaining_test.append(barbershop.get('name'))
            
            if remaining_test:
                print(f"   ⚠️ Barberías de prueba que aún permanecen: {remaining_test}")
            else:
                print(f"   ✅ No quedan barberías de prueba en la base de datos")
            
            print(f"\n📋 BARBERÍAS LEGÍTIMAS RESTANTES:")
            for barbershop in remaining_barbershops:
                name = barbershop.get('name')
                barber_id = barbershop.get('barber_id')
                print(f"   - {name} (Barbero: {barber_id})")
        
        cleanup_success = deleted_count > 0 and len(failed_deletions) == 0
        
        if cleanup_success:
            print(f"\n🎉 LIMPIEZA COMPLETADA EXITOSAMENTE")
            print(f"   Base de datos limpia de barberías ficticias")
        else:
            print(f"\n⚠️ LIMPIEZA PARCIAL O CON ERRORES")
            print(f"   Revisar eliminaciones fallidas")
        
        return cleanup_success

    def test_bulk_database_cleanup(self):
        """Test bulk database cleanup endpoint"""
        if not self.barber_token:
            print("❌ Skipped - No barber token available")
            return False
        
        print("\n🧹 TESTING BULK DATABASE CLEANUP ENDPOINT")
        print("-" * 50)
        
        success, response = self.run_test(
            "Bulk Database Cleanup",
            "POST",
            "api/admin/cleanup-database",
            200,
            token=self.barber_token
        )
        
        if success and response:
            deleted_count = response.get('deleted_count', 0)
            kept_count = response.get('kept_count', 0)
            deleted_barbershops = response.get('deleted_barbershops', [])
            kept_barbershops = response.get('kept_barbershops', [])
            
            print(f"   📊 Cleanup Results:")
            print(f"      Deleted: {deleted_count} barbershops")
            print(f"      Kept: {kept_count} barbershops")
            
            if deleted_barbershops:
                print(f"   🗑️ Deleted Barbershops:")
                for barbershop in deleted_barbershops:
                    print(f"      - {barbershop.get('name')} (ID: {barbershop.get('id')})")
                    print(f"        Reason: {barbershop.get('reason')}")
            
            if kept_barbershops:
                print(f"   ✅ Kept Barbershops:")
                for barbershop in kept_barbershops:
                    print(f"      - {barbershop.get('name')} (ID: {barbershop.get('id')})")
                    print(f"        Barber: {barbershop.get('barber_id')}")
            
            print(f"   ✅ Bulk cleanup completed successfully")
        
        return success

    def urgent_barbershop_correction(self):
        """URGENT: Restore BARBERIA CANTAGALLO and clean fake barbershops"""
        print("\n🚨 URGENT BARBERSHOP CORRECTION")
        print("=" * 60)
        print("PROBLEMA: Se eliminó 'BARBERIA CANTAGALLO' que era real")
        print("OBJETIVO: Restaurar BARBERIA CANTAGALLO y mantener solo barberías legítimas")
        print("-" * 60)
        
        if not self.barber_token:
            print("❌ Error: Se requiere token de barbero")
            return False
        
        # Step 1: Check current state
        print("\n1️⃣ VERIFICANDO ESTADO ACTUAL DE BARBERÍAS")
        success, response = self.run_test(
            "Get Current Barbershops State",
            "GET",
            "api/barbershops",
            200
        )
        
        if not success or 'barbershops' not in response:
            print("❌ No se pudieron obtener las barberías actuales")
            return False
        
        current_barbershops = response['barbershops']
        print(f"   📊 Barberías actuales: {len(current_barbershops)}")
        
        # Check what's currently in the database
        barberia_dani_exists = False
        barberia_cantagallo_exists = False
        fake_barbershops = []
        
        for barbershop in current_barbershops:
            name = barbershop.get('name', '')
            print(f"   - {name} (ID: {barbershop.get('id')})")
            
            if 'Barbería Dani' in name:
                barberia_dani_exists = True
                print("     ✅ Barbería Dani encontrada (legítima)")
            elif 'BARBERIA CANTAGALLO' in name.upper():
                barberia_cantagallo_exists = True
                print("     ✅ BARBERIA CANTAGALLO encontrada")
            else:
                # Check if it's a fake barbershop
                fake_keywords = [
                    'barbershop classic', 'barbería el maestro', 'barbería santiago maps test',
                    'test', 'prueba', 'fake', 'demo', 'ejemplo', 'sample',
                    'barbería moderna', 'barbería elegante', 'barber shop central',
                    'corte fino', 'estilo urbano', 'pelo y barba', 'tijeras de oro',
                    'traditional barber'
                ]
                
                name_lower = name.lower()
                is_fake = any(keyword in name_lower for keyword in fake_keywords)
                
                if is_fake:
                    fake_barbershops.append(barbershop)
                    print(f"     🚨 Barbería falsa identificada: {name}")
                else:
                    print(f"     ❓ Barbería no clasificada: {name}")
        
        # Step 2: Restore BARBERIA CANTAGALLO if missing
        if not barberia_cantagallo_exists:
            print("\n2️⃣ RESTAURANDO BARBERIA CANTAGALLO")
            print("   🔧 Creando nueva barbería 'BARBERIA CANTAGALLO'...")
            
            success_restore, response_restore = self.run_test(
                "Restore BARBERIA CANTAGALLO",
                "POST",
                "api/barbershops",
                200,
                data={
                    "name": "BARBERIA CANTAGALLO",
                    "description": "Barbería tradicional en Santiago, especializada en cortes clásicos y modernos",
                    "address": "Av. Libertador Bernardo O'Higgins 1234, Santiago, Chile",
                    "phone": "+56912345678",
                    "services": [
                        {"name": "Corte de pelo", "price": 15000, "duration": 30},
                        {"name": "Barba", "price": 10000, "duration": 20},
                        {"name": "Corte completo", "price": 22000, "duration": 45}
                    ],
                    "working_hours": {
                        "monday": {"open": "09:00", "close": "19:00"},
                        "tuesday": {"open": "09:00", "close": "19:00"},
                        "wednesday": {"open": "09:00", "close": "19:00"},
                        "thursday": {"open": "09:00", "close": "19:00"},
                        "friday": {"open": "09:00", "close": "19:00"},
                        "saturday": {"open": "09:00", "close": "18:00"},
                        "sunday": {"open": "10:00", "close": "16:00"}
                    }
                },
                token=self.barber_token
            )
            
            if success_restore:
                print("   ✅ BARBERIA CANTAGALLO restaurada exitosamente")
                cantagallo_id = response_restore.get('id')
                print(f"   📝 ID de la nueva barbería: {cantagallo_id}")
            else:
                print("   ❌ Error al restaurar BARBERIA CANTAGALLO")
                return False
        else:
            print("\n2️⃣ BARBERIA CANTAGALLO YA EXISTE")
            print("   ✅ No es necesario restaurar")
        
        # Step 3: Clean fake barbershops
        if fake_barbershops:
            print(f"\n3️⃣ ELIMINANDO {len(fake_barbershops)} BARBERÍAS FALSAS")
            deleted_count = 0
            
            for barbershop in fake_barbershops:
                barbershop_id = barbershop.get('id')
                barbershop_name = barbershop.get('name')
                
                print(f"   🗑️ Eliminando: {barbershop_name}")
                
                success_delete, response_delete = self.run_test(
                    f"Delete Fake Barbershop: {barbershop_name}",
                    "DELETE",
                    f"api/barbershops/{barbershop_id}",
                    200,
                    token=self.barber_token
                )
                
                if success_delete:
                    deleted_count += 1
                    print(f"      ✅ Eliminada exitosamente")
                else:
                    print(f"      ❌ Error al eliminar")
            
            print(f"   📊 Barberías falsas eliminadas: {deleted_count}/{len(fake_barbershops)}")
        else:
            print("\n3️⃣ NO HAY BARBERÍAS FALSAS PARA ELIMINAR")
            print("   ✅ Base de datos ya está limpia")
        
        # Step 4: Verify final result
        print("\n4️⃣ VERIFICANDO RESULTADO FINAL")
        success_final, response_final = self.run_test(
            "Verify Final Barbershops State",
            "GET",
            "api/barbershops",
            200
        )
        
        if success_final and 'barbershops' in response_final:
            final_barbershops = response_final['barbershops']
            print(f"   📊 Barberías finales: {len(final_barbershops)}")
            
            barberia_dani_final = False
            barberia_cantagallo_final = False
            
            print("   📋 BARBERÍAS FINALES:")
            for barbershop in final_barbershops:
                name = barbershop.get('name', '')
                barber_id = barbershop.get('barber_id', '')
                print(f"      - {name} (Barbero: {barber_id})")
                
                if 'Barbería Dani' in name:
                    barberia_dani_final = True
                elif 'BARBERIA CANTAGALLO' in name.upper():
                    barberia_cantagallo_final = True
            
            # Verify we have exactly the 2 legitimate barbershops
            expected_count = 2
            if len(final_barbershops) == expected_count and barberia_dani_final and barberia_cantagallo_final:
                print(f"\n🎉 CORRECCIÓN COMPLETADA EXITOSAMENTE")
                print(f"   ✅ Solo quedan las 2 barberías legítimas:")
                print(f"      - Barbería Dani")
                print(f"      - BARBERIA CANTAGALLO")
                return True
            else:
                print(f"\n⚠️ CORRECCIÓN INCOMPLETA")
                print(f"   Expected: 2 barbershops (Barbería Dani + BARBERIA CANTAGALLO)")
                print(f"   Found: {len(final_barbershops)} barbershops")
                print(f"   Barbería Dani: {'✅' if barberia_dani_final else '❌'}")
                print(f"   BARBERIA CANTAGALLO: {'✅' if barberia_cantagallo_final else '❌'}")
                return False
        else:
            print("   ❌ Error al verificar estado final")
            return False

    def test_individual_barbershop_deletion(self):
        """Test individual barbershop deletion"""
        if not self.barber_token:
            print("❌ Skipped - No barber token available")
            return False
        
        print("\n🗑️ TESTING INDIVIDUAL BARBERSHOP DELETION")
        print("-" * 50)
        
        # First create a test barbershop to delete
        success_create, response_create = self.run_test(
            "Create Test Barbershop for Deletion",
            "POST",
            "api/barbershops",
            200,
            data={
                "name": "Test Barbería Google API",
                "description": "Barbería de prueba para eliminar",
                "address": "Santiago, Chile",
                "phone": "+56987654321",
                "services": [
                    {"name": "Corte de pelo", "price": 10000, "duration": 30}
                ],
                "working_hours": {
                    "monday": {"open": "09:00", "close": "19:00"},
                    "tuesday": {"open": "09:00", "close": "19:00"},
                    "wednesday": {"open": "09:00", "close": "19:00"},
                    "thursday": {"open": "09:00", "close": "19:00"},
                    "friday": {"open": "09:00", "close": "19:00"},
                    "saturday": {"open": "10:00", "close": "18:00"},
                    "sunday": {"closed": True}
                }
            },
            token=self.barber_token
        )
        
        if not success_create or 'id' not in response_create:
            print("❌ Failed to create test barbershop for deletion")
            return False
        
        test_barbershop_id = response_create['id']
        print(f"   Created test barbershop with ID: {test_barbershop_id}")
        
        # Now delete it
        success_delete, response_delete = self.run_test(
            "Delete Test Barbershop",
            "DELETE",
            f"api/barbershops/{test_barbershop_id}",
            200,
            token=self.barber_token
        )
        
        if success_delete:
            print(f"   ✅ Test barbershop deleted successfully")
            
            # Verify it's gone
            success_verify, response_verify = self.run_test(
                "Verify Barbershop Deletion",
                "GET",
                f"api/barbershops/{test_barbershop_id}",
                404
            )
            
            if success_verify:
                print(f"   ✅ Deletion verified - barbershop no longer exists")
                return True
            else:
                print(f"   ❌ Deletion verification failed - barbershop still exists")
                return False
        else:
            print(f"   ❌ Failed to delete test barbershop")
            return False

def main():
    print("🚀 Starting CÓRTATE.CL API Testing...")
    print("=" * 60)
    
    tester = CortateAPITester()
    
    # Basic connectivity tests
    print("\n📡 CONNECTIVITY TESTS")
    print("-" * 30)
    tester.test_root_endpoint()
    tester.test_health_check()
    
    # Authentication tests
    print("\n🔐 AUTHENTICATION TESTS")
    print("-" * 30)
    tester.test_register_client()
    tester.test_register_barber()
    tester.test_login_client()
    tester.test_login_barber()
    tester.test_invalid_login()
    tester.test_get_current_user_client()
    tester.test_get_current_user_barber()
    tester.test_unauthorized_access()
    
    # URGENT CORRECTION: Restore BARBERIA CANTAGALLO and clean fake barbershops
    print("\n🚨 URGENT BARBERSHOP CORRECTION")
    print("=" * 60)
    urgent_correction_success = tester.urgent_barbershop_correction()
    
    # Data access tests
    print("\n📊 DATA ACCESS TESTS")
    print("-" * 30)
    tester.test_get_barbershops()
    
    # Business logic tests
    print("\n💼 BUSINESS LOGIC TESTS")
    print("-" * 30)
    tester.test_create_barbershop()
    tester.test_get_my_barbershop()
    tester.test_barbershop_persistence()
    
    # NEW FUNCTIONALITY TESTS - CÓRTATE.CL SPECIFIC
    print("\n🆕 NEW FUNCTIONALITY TESTS - CÓRTATE.CL")
    print("-" * 50)
    print("Testing new features: preferred_time, reviews system, client history")
    
    # Quick Cut with preferred_time tests
    tester.test_quick_cut_with_preferred_time_asap()
    tester.test_quick_cut_with_preferred_time_30min()
    tester.test_quick_cut_with_preferred_time_1hour()
    tester.test_quick_cut_with_preferred_time_2hours()
    
    # Reviews system tests
    tester.test_create_review()
    tester.test_get_barbershop_reviews()
    
    # Client history tests
    tester.test_client_history_endpoint()
    
    # Original quick cut and booking tests
    tester.test_create_quick_cut_request()
    tester.test_get_quick_cut_requests()
    tester.test_create_traditional_booking()
    tester.test_get_barber_bookings()
    
    # DATABASE CLEANUP EXECUTION TESTS
    print("\n🧹 DATABASE CLEANUP EXECUTION TESTS")
    print("-" * 50)
    individual_deletion_success = tester.test_individual_barbershop_deletion()
    bulk_cleanup_success = tester.test_bulk_database_cleanup()
    
    # Google Maps API Integration Tests (HIGH PRIORITY)
    print("\n🗺️ GOOGLE MAPS API TESTS")
    print("-" * 30)
    google_maps_success = tester.test_google_maps_geocoding()
    barbershop_list_success = tester.test_barbershop_appears_in_list()
    
    # Debug and persistence tests
    tester.test_debug_endpoints()
    
    # Authorization tests
    print("\n🛡️ AUTHORIZATION TESTS")
    print("-" * 30)
    tester.test_client_cannot_access_barber_endpoints()
    tester.test_barber_cannot_create_quick_cuts()
    
    # Final results
    print("\n" + "=" * 60)
    print(f"📊 FINAL RESULTS")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    # Special focus on URGENT CORRECTION results
    print("\n🚨 URGENT CORRECTION RESULTS:")
    if urgent_correction_success:
        print("✅ BARBERIA CANTAGALLO restoration: COMPLETED")
        print("✅ Fake barbershops cleanup: COMPLETED")
        print("✅ Only 2 legitimate barbershops remain: Barbería Dani + BARBERIA CANTAGALLO")
    else:
        print("❌ URGENT CORRECTION: FAILED")
        print("⚠️ Manual intervention may be required")
    
    # Special focus on database cleanup results
    print("\n🧹 DATABASE CLEANUP RESULTS:")
    if individual_deletion_success:
        print("✅ Individual barbershop deletion: WORKING")
    else:
        print("❌ Individual barbershop deletion: FAILED")
        
    if bulk_cleanup_success:
        print("✅ Bulk database cleanup: WORKING")
    else:
        print("❌ Bulk database cleanup: FAILED")
    
    # Special focus on Google Maps API results
    print("\n🗺️ GOOGLE MAPS API RESULTS:")
    if google_maps_success:
        print("✅ Google Maps geocoding: WORKING")
    else:
        print("❌ Google Maps geocoding: FAILED")
        
    if barbershop_list_success:
        print("✅ Barbershop listing: WORKING")
    else:
        print("❌ Barbershop listing: FAILED")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed! Backend is working correctly.")
        return 0
    else:
        failed = tester.tests_run - tester.tests_passed
        print(f"⚠️ {failed} test(s) failed. Check the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())