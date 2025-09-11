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
    tester.test_create_quick_cut_request()
    tester.test_get_quick_cut_requests()
    tester.test_create_traditional_booking()
    tester.test_get_barber_bookings()
    
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
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed! Backend is working correctly.")
        return 0
    else:
        failed = tester.tests_run - tester.tests_passed
        print(f"⚠️ {failed} test(s) failed. Check the issues above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())