from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timedelta
import os
import jwt
import hashlib
import uuid
from passlib.context import CryptContext
import logging
import asyncio
from geopy.distance import geodesic

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="CÓRTATE.CL API", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "cortate-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# MongoDB configuration
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "cortate_db")

# Global MongoDB client
mongodb_client = None
database = None

# Database Models
class User(BaseModel):
    id: Optional[str] = None
    name: str
    email: EmailStr
    password: str
    user_type: str  # "client" or "barber"
    phone: Optional[str] = None
    address: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    created_at: Optional[datetime] = None

class Barbershop(BaseModel):
    id: Optional[str] = None
    barber_id: str
    name: str
    description: Optional[str] = None
    address: str
    lat: float
    lng: float
    services: List[str] = []
    price_range: str
    rating: Optional[float] = 0.0
    reviews_count: Optional[int] = 0
    available: Optional[bool] = True
    images: List[str] = []
    created_at: Optional[datetime] = None

class Booking(BaseModel):
    id: Optional[str] = None
    client_id: str
    barbershop_id: str
    barber_id: str
    service: str
    date: datetime
    price: float
    status: str  # "pending", "confirmed", "completed", "cancelled"
    client_name: Optional[str] = None
    created_at: Optional[datetime] = None

class QuickCutRequest(BaseModel):
    id: Optional[str] = None
    client_id: str
    client_name: Optional[str] = None
    service: str
    max_price: int
    lat: float
    lng: float
    status: str  # "pending", "accepted", "rejected", "completed"
    barber_id: Optional[str] = None
    distance: Optional[float] = None
    created_at: Optional[datetime] = None

class Review(BaseModel):
    id: Optional[str] = None
    client_id: str
    barbershop_id: str
    booking_id: str
    rating: int
    comment: Optional[str] = None
    images: List[str] = []
    created_at: Optional[datetime] = None

# Request/Response Models
class UserRegistration(BaseModel):
    name: str
    email: EmailStr
    password: str
    confirmPassword: str
    userType: str
    phone: Optional[str] = None
    address: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

class QuickCutRequestCreate(BaseModel):
    service: str
    max_price: int
    lat: float
    lng: float

class QuickCutResponse(BaseModel):
    accept: bool

@app.on_event("startup")
async def startup_db_client():
    global mongodb_client, database
    try:
        mongodb_client = AsyncIOMotorClient(MONGO_URL)
        database = mongodb_client[DB_NAME]
        
        # Test the connection
        await database.command("ping")
        logger.info("Successfully connected to MongoDB")
        
        # Create indexes
        await database.users.create_index("email", unique=True)
        # Create simple indexes for lat/lng instead of geospatial for now
        await database.barbershops.create_index("lat")
        await database.barbershops.create_index("lng")
        logger.info("Database indexes created")
        
        # Create sample barbershops if none exist
        barbershops_count = await database.barbershops.count_documents({})
        if barbershops_count == 0:
            await create_sample_data()
        
    except Exception as e:
        logger.error(f"Error connecting to MongoDB: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_db_client():
    if mongodb_client:
        mongodb_client.close()
        logger.info("MongoDB connection closed")

async def create_sample_data():
    """Create sample barbershops for testing"""
    sample_barbershops = [
        {
            "id": str(uuid.uuid4()),
            "barber_id": "sample_barber_1",
            "name": "Barbería Moderna",
            "description": "La mejor barbería de Las Condes",
            "address": "Las Condes, Santiago",
            "lat": -33.4260,
            "lng": -70.5682,
            "services": ["Corte de pelo", "Corte + barba"],
            "price_range": "$8,000 - $15,000",
            "rating": 4.8,
            "reviews_count": 120,
            "available": True,
            "images": [],
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "barber_id": "sample_barber_2",
            "name": "Barbería Elegante",
            "description": "Cortes clásicos y modernos en Providencia",
            "address": "Providencia, Santiago",
            "lat": -33.4378,
            "lng": -70.6304,
            "services": ["Corte de pelo", "Corte + barba"],
            "price_range": "$10,000 - $18,000",
            "rating": 4.9,
            "reviews_count": 250,
            "available": True,
            "images": [],
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "barber_id": "sample_barber_3",
            "name": "Barbershop Classic",
            "description": "Tradición y calidad en Ñuñoa",
            "address": "Ñuñoa, Santiago",
            "lat": -33.4569,
            "lng": -70.5975,
            "services": ["Corte de pelo", "Corte + barba"],
            "price_range": "$6,000 - $12,000",
            "rating": 4.7,
            "reviews_count": 85,
            "available": False,
            "images": [],
            "created_at": datetime.utcnow()
        }
    ]
    
    await database.barbershops.insert_many(sample_barbershops)
    logger.info("Sample barbershops created")

# Utility functions
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def generate_uuid():
    return str(uuid.uuid4())

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        user = await database.users.find_one({"id": user_id})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

def calculate_distance(lat1, lng1, lat2, lng2):
    """Calculate distance between two points in kilometers"""
    try:
        return round(geodesic((lat1, lng1), (lat2, lng2)).kilometers, 1)
    except:
        return 0.0

# API Routes

@app.get("/")
async def root():
    return {"message": "CÓRTATE.CL API is running!", "version": "1.0.0"}

@app.get("/api/health")
async def health_check():
    try:
        await database.command("ping")
        return {"status": "healthy", "database": "connected", "timestamp": datetime.utcnow()}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Service unhealthy: {str(e)}")

# Authentication Routes
@app.post("/api/auth/register", response_model=TokenResponse)
async def register_user(user_data: UserRegistration):
    try:
        if user_data.password != user_data.confirmPassword:
            raise HTTPException(status_code=400, detail="Las contraseñas no coinciden")
        
        existing_user = await database.users.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="El email ya está registrado")
        
        user_id = generate_uuid()
        hashed_password = hash_password(user_data.password)
        
        new_user = {
            "id": user_id,
            "name": user_data.name,
            "email": user_data.email,
            "password": hashed_password,
            "user_type": user_data.userType,
            "phone": user_data.phone,
            "address": user_data.address,
            "created_at": datetime.utcnow()
        }
        
        await database.users.insert_one(new_user)
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user_id}, expires_delta=access_token_expires
        )
        
        # Remove MongoDB ObjectId and password from response
        new_user.pop("password")
        if "_id" in new_user:
            new_user.pop("_id")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": new_user
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@app.post("/api/auth/login", response_model=TokenResponse)
async def login_user(user_data: UserLogin):
    try:
        user = await database.users.find_one({"email": user_data.email})
        if not user or not verify_password(user_data.password, user["password"]):
            raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")
        
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user["id"]}, expires_delta=access_token_expires
        )
        
        user.pop("password")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@app.get("/api/auth/me")
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    return current_user

# Barbershop Routes
@app.get("/api/barbershops")
async def get_barbershops():
    try:
        barbershops = await database.barbershops.find().to_list(length=50)
        return {"barbershops": barbershops}
    except Exception as e:
        logger.error(f"Error fetching barbershops: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@app.get("/api/barbershops/{barbershop_id}")
async def get_barbershop(barbershop_id: str):
    try:
        barbershop = await database.barbershops.find_one({"id": barbershop_id})
        if not barbershop:
            raise HTTPException(status_code=404, detail="Barbería no encontrada")
        
        reviews = await database.reviews.find({"barbershop_id": barbershop_id}).to_list(length=20)
        barbershop["reviews"] = reviews
        
        return barbershop
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching barbershop: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@app.post("/api/barbershops")
async def create_barbershop(barbershop_data: Barbershop, current_user: dict = Depends(get_current_user)):
    try:
        if current_user["user_type"] != "barber":
            raise HTTPException(status_code=403, detail="Solo los barberos pueden crear barberías")
        
        barbershop_id = generate_uuid()
        new_barbershop = barbershop_data.dict()
        new_barbershop["id"] = barbershop_id
        new_barbershop["barber_id"] = current_user["id"]
        new_barbershop["created_at"] = datetime.utcnow()
        
        await database.barbershops.insert_one(new_barbershop)
        return new_barbershop
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating barbershop: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

# Booking Routes
@app.post("/api/bookings")
async def create_booking(booking_data: Booking, current_user: dict = Depends(get_current_user)):
    try:
        if current_user["user_type"] != "client":
            raise HTTPException(status_code=403, detail="Solo los clientes pueden hacer reservas")
        
        booking_id = generate_uuid()
        new_booking = booking_data.dict()
        new_booking["id"] = booking_id
        new_booking["client_id"] = current_user["id"]
        new_booking["client_name"] = current_user["name"]
        new_booking["status"] = "pending"
        new_booking["created_at"] = datetime.utcnow()
        
        await database.bookings.insert_one(new_booking)
        return new_booking
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating booking: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@app.get("/api/bookings/user")
async def get_user_bookings(current_user: dict = Depends(get_current_user)):
    try:
        if current_user["user_type"] == "client":
            bookings = await database.bookings.find({"client_id": current_user["id"]}).to_list(length=50)
        else:
            bookings = await database.bookings.find({"barber_id": current_user["id"]}).to_list(length=50)
        
        return {"bookings": bookings}
    except Exception as e:
        logger.error(f"Error fetching user bookings: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@app.get("/api/bookings/barber")
async def get_barber_bookings(current_user: dict = Depends(get_current_user)):
    try:
        if current_user["user_type"] != "barber":
            raise HTTPException(status_code=403, detail="Solo barberos pueden ver sus citas")
        
        # Sample appointments for now
        sample_appointments = [
            {
                "id": "1",
                "service": "Corte de pelo",
                "client_name": "Juan Pérez",
                "price": 12000,
                "time": "10:00",
                "date": datetime.utcnow().strftime("%Y-%m-%d"),
                "status": "confirmed"
            },
            {
                "id": "2", 
                "service": "Corte + barba",
                "client_name": "Carlos López",
                "price": 18000,
                "time": "14:30",
                "date": datetime.utcnow().strftime("%Y-%m-%d"),
                "status": "pending"
            }
        ]
        
        return {"bookings": sample_appointments}
    except Exception as e:
        logger.error(f"Error fetching barber bookings: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

# Quick Cut Routes
@app.post("/api/quick-cuts/request")
async def create_quick_cut_request(request_data: QuickCutRequestCreate, current_user: dict = Depends(get_current_user)):
    try:
        if current_user["user_type"] != "client":
            raise HTTPException(status_code=403, detail="Solo los clientes pueden solicitar cortes rápidos")
        
        request_id = generate_uuid()
        
        # Find nearby available barbers
        barbershops = await database.barbershops.find({"available": True}).to_list(length=50)
        
        new_request = {
            "id": request_id,
            "client_id": current_user["id"],
            "client_name": current_user["name"],
            "service": request_data.service,
            "max_price": request_data.max_price,
            "lat": request_data.lat,
            "lng": request_data.lng,
            "status": "pending",
            "created_at": datetime.utcnow()
        }
        
        await database.quick_cut_requests.insert_one(new_request)
        
        # Notify nearby barbers (simulated)
        await notify_nearby_barbers(new_request, barbershops)
        
        return new_request
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating quick cut request: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@app.get("/api/quick-cuts/requests")
async def get_quick_cut_requests(current_user: dict = Depends(get_current_user)):
    try:
        if current_user["user_type"] != "barber":
            raise HTTPException(status_code=403, detail="Solo barberos pueden ver solicitudes")
        
        # Sample requests for now
        sample_requests = [
            {
                "id": str(uuid.uuid4()),
                "client_name": "María García",
                "service": "Corte de pelo",
                "max_price": 15000,
                "distance": 2.3,
                "status": "pending",
                "created_at": datetime.utcnow()
            },
            {
                "id": str(uuid.uuid4()),
                "client_name": "Pedro Silva",
                "service": "Corte + barba", 
                "max_price": 20000,
                "distance": 1.8,
                "status": "pending",
                "created_at": datetime.utcnow()
            }
        ]
        
        return {"requests": sample_requests}
    except Exception as e:
        logger.error(f"Error fetching quick cut requests: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@app.post("/api/quick-cuts/{request_id}/respond")
async def respond_to_quick_cut(request_id: str, response: QuickCutResponse, current_user: dict = Depends(get_current_user)):
    try:
        if current_user["user_type"] != "barber":
            raise HTTPException(status_code=403, detail="Solo barberos pueden responder solicitudes")
        
        # Update request status
        if response.accept:
            await database.quick_cut_requests.update_one(
                {"id": request_id},
                {"$set": {"status": "accepted", "barber_id": current_user["id"]}}
            )
        else:
            await database.quick_cut_requests.update_one(
                {"id": request_id},
                {"$set": {"status": "rejected"}}
            )
        
        return {"message": "Respuesta registrada correctamente"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error responding to quick cut: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

async def notify_nearby_barbers(request, barbershops):
    """Notify barbers within 5km radius"""
    try:
        for barbershop in barbershops:
            distance = calculate_distance(
                request["lat"], request["lng"],
                barbershop["lat"], barbershop["lng"]
            )
            
            if distance <= 5.0:  # Within 5km
                # In a real app, this would send push notifications
                logger.info(f"Notifying barber {barbershop['barber_id']} about request {request['id']}")
                
    except Exception as e:
        logger.error(f"Error notifying barbers: {e}")

# Review Routes
@app.post("/api/reviews")
async def create_review(review_data: Review, current_user: dict = Depends(get_current_user)):
    try:
        if current_user["user_type"] != "client":
            raise HTTPException(status_code=403, detail="Solo los clientes pueden dejar reseñas")
        
        review_id = generate_uuid()
        new_review = review_data.dict()
        new_review["id"] = review_id
        new_review["client_id"] = current_user["id"]
        new_review["created_at"] = datetime.utcnow()
        
        await database.reviews.insert_one(new_review)
        await update_barbershop_rating(review_data.barbershop_id)
        
        return new_review
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating review: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

async def update_barbershop_rating(barbershop_id: str):
    try:
        reviews = await database.reviews.find({"barbershop_id": barbershop_id}).to_list(length=1000)
        if reviews:
            avg_rating = sum(review["rating"] for review in reviews) / len(reviews)
            await database.barbershops.update_one(
                {"id": barbershop_id},
                {"$set": {"rating": round(avg_rating, 1), "reviews_count": len(reviews)}}
            )
    except Exception as e:
        logger.error(f"Error updating barbershop rating: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)