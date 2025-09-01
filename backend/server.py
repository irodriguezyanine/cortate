from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
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
import requests
import base64
from PIL import Image
import io

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

# Mount static files for uploaded images
os.makedirs("/app/uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="/app/uploads"), name="uploads")

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "cortate-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# MongoDB configuration
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "cortate_db")

# Google Maps API Key
GOOGLE_API_KEY = "AIzaSyB955rXhAh3MWSVAj_UdAABd079VDSJl5c"

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
    services: List[dict] = []  # Changed to include price and duration
    phone: Optional[str] = None
    rating: Optional[float] = 0.0
    reviews_count: Optional[int] = 0
    available: Optional[bool] = True
    images: List[str] = []
    profile_image: Optional[str] = None
    cover_image: Optional[str] = None
    working_hours: Optional[dict] = {}
    created_at: Optional[datetime] = None

class BarbershopCreate(BaseModel):
    name: str
    description: str
    address: str
    phone: str
    services: List[dict]
    working_hours: dict

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
    client_name: Optional[str] = None
    barbershop_id: str
    booking_id: Optional[str] = None
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

class ReviewCreate(BaseModel):
    barbershop_id: str
    rating: int
    comment: Optional[str] = None

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
        await database.barbershops.create_index("lat")
        await database.barbershops.create_index("lng")
        await database.barbershops.create_index("barber_id")
        await database.reviews.create_index("barbershop_id")
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

def calculate_distance(lat1, lng1, lat2, lng2):
    """Calculate distance between two points in kilometers"""
    try:
        return round(geodesic((lat1, lng1), (lat2, lng2)).kilometers, 1)
    except:
        return 0.0

async def geocode_address(address: str):
    """Convert address to coordinates using Google Geocoding API"""
    try:
        url = f"https://maps.googleapis.com/maps/api/geocode/json"
        params = {
            "address": address,
            "key": GOOGLE_API_KEY
        }
        
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        
        if data["status"] == "OK" and data["results"]:
            location = data["results"][0]["geometry"]["location"]
            return location["lat"], location["lng"]
        else:
            logger.error(f"Geocoding failed: {data.get('status', 'Unknown error')}")
            # Return default Santiago coordinates if geocoding fails
            return -33.4489, -70.6693
            
    except Exception as e:
        logger.error(f"Error geocoding address: {e}")
        # Return default Santiago coordinates
        return -33.4489, -70.6693

async def save_uploaded_file(file: UploadFile) -> str:
    """Save uploaded file and return filename"""
    try:
        # Generate unique filename
        file_extension = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        filename = f"{generate_uuid()}.{file_extension}"
        file_path = f"/app/uploads/{filename}"
        
        # Save file
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        
        return filename
    except Exception as e:
        logger.error(f"Error saving file: {e}")
        raise HTTPException(status_code=500, detail="Error saving file")

# API Routes

@app.get("/")
async def root():
    return {"message": "CÓRTATE.CL API is running!", "version": "2.0.0"}

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
        
        # Geocode address if provided
        lat, lng = None, None
        if user_data.address:
            lat, lng = await geocode_address(user_data.address)
        
        new_user = {
            "id": user_id,
            "name": user_data.name,
            "email": user_data.email,
            "password": hashed_password,
            "user_type": user_data.userType,
            "phone": user_data.phone,
            "address": user_data.address,
            "lat": lat,
            "lng": lng,
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
        
        # Remove MongoDB ObjectId and password from response
        user.pop("password")
        if "_id" in user:
            user.pop("_id")
        
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
    # Remove MongoDB ObjectId
    if "_id" in current_user:
        current_user.pop("_id")
    if "password" in current_user:
        current_user.pop("password")
    return current_user

# Barbershop Routes
@app.get("/api/barbershops")
async def get_barbershops():
    try:
        barbershops = await database.barbershops.find().to_list(length=100)
        # Clean MongoDB ObjectIds and add full image URLs
        for barbershop in barbershops:
            if "_id" in barbershop:
                barbershop.pop("_id")
            
            # Convert relative image paths to full URLs
            if barbershop.get("images"):
                barbershop["images"] = [f"/uploads/{img}" for img in barbershop["images"]]
            if barbershop.get("profile_image"):
                barbershop["profile_image"] = f"/uploads/{barbershop['profile_image']}"
            if barbershop.get("cover_image"):
                barbershop["cover_image"] = f"/uploads/{barbershop['cover_image']}"
        
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
        
        # Clean MongoDB ObjectId
        if "_id" in barbershop:
            barbershop.pop("_id")
        
        # Get reviews for this barbershop
        reviews = await database.reviews.find({"barbershop_id": barbershop_id}).to_list(length=50)
        for review in reviews:
            if "_id" in review:
                review.pop("_id")
            if review.get("images"):
                review["images"] = [f"/uploads/{img}" for img in review["images"]]
        
        barbershop["reviews"] = reviews
        
        return barbershop
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching barbershop: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@app.post("/api/barbershops")
async def create_barbershop(
    barbershop_data: BarbershopCreate,
    current_user: dict = Depends(get_current_user)
):
    try:
        if current_user["user_type"] != "barber":
            raise HTTPException(status_code=403, detail="Solo los barberos pueden crear barberías")
        
        # Check if barber already has a barbershop
        existing_barbershop = await database.barbershops.find_one({"barber_id": current_user["id"]})
        if existing_barbershop:
            raise HTTPException(status_code=400, detail="Ya tienes una barbería registrada")
        
        # Geocode the address
        lat, lng = await geocode_address(barbershop_data.address)
        
        barbershop_id = generate_uuid()
        new_barbershop = {
            "id": barbershop_id,
            "barber_id": current_user["id"],
            "name": barbershop_data.name,
            "description": barbershop_data.description,
            "address": barbershop_data.address,
            "lat": lat,
            "lng": lng,
            "phone": barbershop_data.phone,
            "services": barbershop_data.services,
            "working_hours": barbershop_data.working_hours,
            "rating": 0.0,
            "reviews_count": 0,
            "available": True,
            "images": [],
            "profile_image": None,
            "cover_image": None,
            "created_at": datetime.utcnow()
        }
        
        await database.barbershops.insert_one(new_barbershop)
        
        # Remove MongoDB ObjectId
        if "_id" in new_barbershop:
            new_barbershop.pop("_id")
        
        return new_barbershop
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating barbershop: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@app.get("/api/barbershops/my")
async def get_my_barbershop(current_user: dict = Depends(get_current_user)):
    try:
        if current_user["user_type"] != "barber":
            raise HTTPException(status_code=403, detail="Solo barberos pueden acceder")
        
        barbershop = await database.barbershops.find_one({"barber_id": current_user["id"]})
        if not barbershop:
            return {"barbershop": None}
        
        if "_id" in barbershop:
            barbershop.pop("_id")
        
        return {"barbershop": barbershop}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching barbershop: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

# File Upload Routes
@app.post("/api/barbershops/{barbershop_id}/upload-image")
async def upload_barbershop_image(
    barbershop_id: str,
    file: UploadFile = File(...),
    image_type: str = Form(...),  # "profile", "cover", or "gallery"
    current_user: dict = Depends(get_current_user)
):
    try:
        if current_user["user_type"] != "barber":
            raise HTTPException(status_code=403, detail="Solo barberos pueden subir imágenes")
        
        # Verify barbershop belongs to current user
        barbershop = await database.barbershops.find_one({
            "id": barbershop_id,
            "barber_id": current_user["id"]
        })
        if not barbershop:
            raise HTTPException(status_code=404, detail="Barbería no encontrada")
        
        # Save uploaded file
        filename = await save_uploaded_file(file)
        
        # Update barbershop based on image type
        if image_type == "profile":
            await database.barbershops.update_one(
                {"id": barbershop_id},
                {"$set": {"profile_image": filename}}
            )
        elif image_type == "cover":
            await database.barbershops.update_one(
                {"id": barbershop_id},
                {"$set": {"cover_image": filename}}
            )
        elif image_type == "gallery":
            await database.barbershops.update_one(
                {"id": barbershop_id},
                {"$push": {"images": filename}}
            )
        else:
            raise HTTPException(status_code=400, detail="Tipo de imagen inválido")
        
        return {"message": "Imagen subida exitosamente", "filename": filename}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading image: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

# Review Routes
@app.post("/api/reviews")
async def create_review(
    review_data: ReviewCreate,
    current_user: dict = Depends(get_current_user)
):
    try:
        if current_user["user_type"] != "client":
            raise HTTPException(status_code=403, detail="Solo los clientes pueden dejar reseñas")
        
        # Check if barbershop exists
        barbershop = await database.barbershops.find_one({"id": review_data.barbershop_id})
        if not barbershop:
            raise HTTPException(status_code=404, detail="Barbería no encontrada")
        
        review_id = generate_uuid()
        new_review = {
            "id": review_id,
            "client_id": current_user["id"],
            "client_name": current_user["name"],
            "barbershop_id": review_data.barbershop_id,
            "rating": review_data.rating,
            "comment": review_data.comment,
            "images": [],
            "created_at": datetime.utcnow()
        }
        
        await database.reviews.insert_one(new_review)
        await update_barbershop_rating(review_data.barbershop_id)
        
        if "_id" in new_review:
            new_review.pop("_id")
        
        return new_review
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating review: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@app.post("/api/reviews/{review_id}/upload-image")
async def upload_review_image(
    review_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    try:
        if current_user["user_type"] != "client":
            raise HTTPException(status_code=403, detail="Solo clientes pueden subir imágenes")
        
        # Verify review belongs to current user
        review = await database.reviews.find_one({
            "id": review_id,
            "client_id": current_user["id"]
        })
        if not review:
            raise HTTPException(status_code=404, detail="Reseña no encontrada")
        
        # Save uploaded file
        filename = await save_uploaded_file(file)
        
        # Add image to review
        await database.reviews.update_one(
            {"id": review_id},
            {"$push": {"images": filename}}
        )
        
        return {"message": "Imagen subida exitosamente", "filename": filename}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading review image: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

@app.get("/api/reviews/barbershop/{barbershop_id}")
async def get_barbershop_reviews(barbershop_id: str):
    try:
        reviews = await database.reviews.find({"barbershop_id": barbershop_id}).to_list(length=100)
        
        # Clean ObjectIds and convert image paths
        for review in reviews:
            if "_id" in review:
                review.pop("_id")
            if review.get("images"):
                review["images"] = [f"/uploads/{img}" for img in review["images"]]
        
        return {"reviews": reviews}
        
    except Exception as e:
        logger.error(f"Error fetching reviews: {e}")
        raise HTTPException(status_code=500, detail="Error interno del servidor")

# Quick Cut Routes (unchanged from previous version)
@app.post("/api/quick-cuts/request")
async def create_quick_cut_request(request_data: QuickCutRequestCreate, current_user: dict = Depends(get_current_user)):
    try:
        if current_user["user_type"] != "client":
            raise HTTPException(status_code=403, detail="Solo los clientes pueden solicitar cortes rápidos")
        
        request_id = generate_uuid()
        
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
        
        if "_id" in new_request:
            new_request.pop("_id")
        
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
        
        # Get real requests from database
        requests = await database.quick_cut_requests.find({"status": "pending"}).to_list(length=50)
        
        for request in requests:
            if "_id" in request:
                request.pop("_id")
            # Calculate distance if barber has location
            if current_user.get("lat") and current_user.get("lng"):
                request["distance"] = calculate_distance(
                    current_user["lat"], current_user["lng"],
                    request["lat"], request["lng"]
                )
        
        return {"requests": requests}
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

# Booking Routes
@app.get("/api/bookings/barber")
async def get_barber_bookings(current_user: dict = Depends(get_current_user)):
    try:
        if current_user["user_type"] != "barber":
            raise HTTPException(status_code=403, detail="Solo barberos pueden ver sus citas")
        
        # Get real bookings from database
        bookings = await database.bookings.find({"barber_id": current_user["id"]}).to_list(length=50)
        
        for booking in bookings:
            if "_id" in booking:
                booking.pop("_id")
        
        return {"bookings": bookings}
    except Exception as e:
        logger.error(f"Error fetching barber bookings: {e}")
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