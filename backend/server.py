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
    service: str
    date: datetime
    price: float
    status: str  # "pending", "confirmed", "completed", "cancelled"
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
        await database.barbershops.create_index([("lat", "2dsphere"), ("lng", "2dsphere")])
        logger.info("Database indexes created")
        
    except Exception as e:
        logger.error(f"Error connecting to MongoDB: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_db_client():
    if mongodb_client:
        mongodb_client.close()
        logger.info("MongoDB connection closed")

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

# API Routes

@app.get("/")
async def root():
    return {"message": "CÓRTATE.CL API is running!", "version": "1.0.0"}

@app.get("/api/health")
async def health_check():
    try:
        # Test database connection
        await database.command("ping")
        return {"status": "healthy", "database": "connected", "timestamp": datetime.utcnow()}
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Service unhealthy: {str(e)}")

# Authentication Routes
@app.post("/api/auth/register", response_model=TokenResponse)
async def register_user(user_data: UserRegistration):
    try:
        # Validate passwords match
        if user_data.password != user_data.confirmPassword:
            raise HTTPException(status_code=400, detail="Las contraseñas no coinciden")
        
        # Check if user exists
        existing_user = await database.users.find_one({"email": user_data.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="El email ya está registrado")
        
        # Create new user
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
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user_id}, expires_delta=access_token_expires
        )
        
        # Remove password from response
        new_user.pop("password")
        
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
        # Find user by email
        user = await database.users.find_one({"email": user_data.email})
        if not user or not verify_password(user_data.password, user["password"]):
            raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")
        
        # Create access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user["id"]}, expires_delta=access_token_expires
        )
        
        # Remove password from response
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
        
        # Get reviews for this barbershop
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
        field = "client_id" if current_user["user_type"] == "client" else "barber_id"
        bookings = await database.bookings.find({field: current_user["id"]}).to_list(length=50)
        return {"bookings": bookings}
    except Exception as e:
        logger.error(f"Error fetching user bookings: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

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
        
        # Update barbershop rating
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

# Search Routes
@app.get("/api/search/nearby")
async def search_nearby_barbershops(lat: float, lng: float, radius: int = 5000):
    try:
        # Simple distance calculation (in production, use MongoDB geospatial queries)
        barbershops = await database.barbershops.find({"available": True}).to_list(length=50)
        
        # Filter by distance (simplified calculation)
        nearby_barbershops = []
        for barbershop in barbershops:
            # Simple distance calculation (should use proper geospatial calculation)
            if abs(barbershop["lat"] - lat) < 0.05 and abs(barbershop["lng"] - lng) < 0.05:
                nearby_barbershops.append(barbershop)
        
        return {"barbershops": nearby_barbershops}
        
    except Exception as e:
        logger.error(f"Error searching nearby barbershops: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@app.get("/api/search/quick-cut")
async def quick_cut_search(service: str, max_price: int, lat: float, lng: float):
    try:
        # Find available barbershops that match criteria
        barbershops = await database.barbershops.find({
            "available": True,
            "services": service
        }).to_list(length=20)
        
        # Filter by price and location (simplified)
        suitable_barbershops = []
        for barbershop in barbershops:
            price_min = int(barbershop["price_range"].split(" - ")[0].replace("$", "").replace(",", ""))
            if price_min <= max_price:
                suitable_barbershops.append(barbershop)
        
        return {"barbershops": suitable_barbershops}
        
    except Exception as e:
        logger.error(f"Error in quick cut search: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)