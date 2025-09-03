from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form, Request
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import base64
import mimetypes

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Helper functions for MongoDB serialization
def prepare_for_mongo(data):
    """Convert Python objects to MongoDB-compatible format"""
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, datetime):
                data[key] = value.isoformat()
            elif isinstance(value, dict):
                data[key] = prepare_for_mongo(value)
            elif isinstance(value, list):
                data[key] = [prepare_for_mongo(item) if isinstance(item, dict) else item for item in value]
    return data

def parse_from_mongo(item):
    """Convert MongoDB data back to Python objects"""
    if isinstance(item, dict):
        for key, value in item.items():
            if key.endswith('_at') or key == 'timestamp':
                if isinstance(value, str):
                    try:
                        item[key] = datetime.fromisoformat(value.replace('Z', '+00:00'))
                    except:
                        pass
            elif isinstance(value, dict):
                item[key] = parse_from_mongo(value)
            elif isinstance(value, list):
                item[key] = [parse_from_mongo(v) if isinstance(v, dict) else v for v in value]
    return item

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: str
    display_name: str
    bio: Optional[str] = None
    profile_image: Optional[str] = None
    is_creator: bool = False
    subscriber_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    display_name: str
    bio: Optional[str] = None
    is_creator: bool = False

class Content(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    creator_id: str
    creator_username: str
    creator_display_name: str
    creator_profile_image: Optional[str] = None
    title: str
    description: Optional[str] = None
    content_type: str  # 'image', 'video', 'text', 'mixed'
    media_urls: List[str] = []
    is_free: bool = True
    price: Optional[float] = None
    subscription_only: bool = False
    tags: List[str] = []
    like_count: int = 0
    comment_count: int = 0
    view_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ContentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    content_type: str
    media_files: Optional[List[str]] = []  # base64 encoded files
    is_free: bool = True
    price: Optional[float] = None
    subscription_only: bool = False
    tags: List[str] = []

class ContentResponse(BaseModel):
    id: str
    creator_id: str
    creator_username: str
    creator_display_name: str
    creator_profile_image: Optional[str] = None
    title: str
    description: Optional[str] = None
    content_type: str
    media_urls: List[str] = []
    is_free: bool
    price: Optional[float] = None
    subscription_only: bool
    tags: List[str] = []
    like_count: int
    comment_count: int
    view_count: int
    created_at: datetime
    is_locked: bool = False  # Whether user has access to this content

# Sample data creation
async def create_sample_data():
    """Create sample users and content for demo purposes"""
    
    # Check if sample data already exists
    existing_users = await db.users.count_documents({})
    if existing_users > 0:
        return
    
    # Sample creators
    sample_creators = [
        {
            "id": str(uuid.uuid4()),
            "username": "sophia_creative",
            "email": "sophia@example.com",
            "display_name": "Sophia Martinez",
            "bio": "Digital artist & content creator sharing exclusive behind-the-scenes content",
            "profile_image": "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
            "is_creator": True,
            "subscriber_count": 1243,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "username": "alex_photo",
            "email": "alex@example.com", 
            "display_name": "Alex Thompson",
            "bio": "Professional photographer capturing life's beautiful moments",
            "profile_image": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
            "is_creator": True,
            "subscriber_count": 856,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "username": "maya_fitness",
            "email": "maya@example.com",
            "display_name": "Maya Johnson",
            "bio": "Fitness coach sharing workout routines and healthy lifestyle tips",
            "profile_image": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
            "is_creator": True,
            "subscriber_count": 2156,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    # Insert sample creators
    await db.users.insert_many(sample_creators)
    
    # Sample content using the curated images
    content_images = [
        "https://images.unsplash.com/photo-1636971828014-0f3493cba88a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHwxfHxjb250ZW50JTIwY3JlYXRvcnxlbnwwfHx8fDE3NTY4MjExNTZ8MA&ixlib=rb-4.1.0&q=85",
        "https://images.unsplash.com/photo-1664277497095-424e085175e8?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHwyfHxjb250ZW50JTIwY3JlYXRvcnxlbnwwfHx8fDE3NTY4MjExNTZ8MA&ixlib=rb-4.1.0&q=85",
        "https://images.unsplash.com/photo-1627244714766-94dab62ed964?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHwzfHxjb250ZW50JTIwY3JlYXRvcnxlbnwwfHx8fDE3NTY4MjExNTZ8MA&ixlib=rb-4.1.0&q=85",
        "https://images.unsplash.com/photo-1630797160666-38e8c5ba44c1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzF8MHwxfHNlYXJjaHw0fHxjb250ZW50JTIwY3JlYXRvcnxlbnwwfHx8fDE3NTY4MjExNTZ8MA&ixlib=rb-4.1.0&q=85",
        "https://images.pexels.com/photos/3576258/pexels-photo-3576258.jpeg",
        "https://images.pexels.com/photos/33676719/pexels-photo-33676719.jpeg",
        "https://images.unsplash.com/photo-1516321497487-e288fb19713f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwyfHxkaWdpdGFsJTIwcGxhdGZvcm18ZW58MHx8fHwxNzU2OTA5NzEwfDA&ixlib=rb-4.1.0&q=85",
        "https://images.unsplash.com/photo-1504270997636-07ddfbd48945?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHw0fHxkaWdpdGFsJTIwcGxhdGZvcm18ZW58MHx8fHwxNzU2OTA5NzEwfDA&ixlib=rb-4.1.0&q=85"
    ]
    
    sample_content = []
    content_titles = [
        "Behind the Scenes: Studio Setup",
        "Professional Lighting Tips",
        "Creative Process Revealed",
        "Exclusive Photography Session",
        "Advanced Editing Techniques",
        "Creative Workspace Tour",
        "Digital Art Process",
        "Content Creation Workflow"
    ]
    
    content_descriptions = [
        "Get an exclusive look at my professional studio setup and equipment",
        "Learn the secrets behind perfect lighting for content creation",
        "Watch my creative process from concept to final result",
        "Access to my premium photography session - subscriber exclusive",
        "Advanced editing techniques that I use in my workflow",
        "Take a tour of my creative workspace and setup",
        "Step-by-step digital art creation process",
        "Complete workflow from planning to publishing content"
    ]
    
    for i, creator in enumerate(sample_creators):
        # Create 2-3 posts per creator
        for j in range(2 if i == 0 else 3):
            content_index = (i * 3) + j
            if content_index < len(content_images):
                is_free = j == 0  # First post is free, others are paid
                content = {
                    "id": str(uuid.uuid4()),
                    "creator_id": creator["id"],
                    "creator_username": creator["username"],
                    "creator_display_name": creator["display_name"],
                    "creator_profile_image": creator["profile_image"],
                    "title": content_titles[content_index % len(content_titles)],
                    "description": content_descriptions[content_index % len(content_descriptions)],
                    "content_type": "image",
                    "media_urls": [content_images[content_index]],
                    "is_free": is_free,
                    "price": None if is_free else (9.99 if j == 1 else 4.99),
                    "subscription_only": j == 2,  # Last post is subscription only
                    "tags": ["creative", "exclusive", "premium"] if not is_free else ["free", "preview"],
                    "like_count": 12 + (i * 15) + (j * 8),
                    "comment_count": 3 + (i * 2) + j,
                    "view_count": 156 + (i * 50) + (j * 20),
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                sample_content.append(content)
    
    # Insert sample content
    if sample_content:
        await db.content.insert_many(sample_content)

# API Routes
@api_router.get("/")
async def root():
    return {"message": "Content Platform API"}

@api_router.get("/content", response_model=List[ContentResponse])
async def get_content(skip: int = 0, limit: int = 20, creator_id: Optional[str] = None):
    """Get content feed with pagination"""
    
    # Ensure sample data exists
    await create_sample_data()
    
    query = {}
    if creator_id:
        query["creator_id"] = creator_id
    
    content_list = await db.content.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(length=None)
    
    # Convert to response format and add access control
    response_content = []
    for content_item in content_list:
        content_item = parse_from_mongo(content_item)
        content_response = ContentResponse(**content_item)
        
        # For demo purposes, mark non-free content as locked
        if not content_item["is_free"]:
            content_response.is_locked = True
            # Hide media URLs for locked content
            content_response.media_urls = []
        
        response_content.append(content_response)
    
    return response_content

@api_router.get("/creators", response_model=List[User])
async def get_creators():
    """Get list of content creators"""
    
    # Ensure sample data exists
    await create_sample_data()
    
    creators = await db.users.find({"is_creator": True}).to_list(length=None)
    return [User(**parse_from_mongo(creator)) for creator in creators]

@api_router.get("/content/{content_id}", response_model=ContentResponse)
async def get_content_by_id(content_id: str):
    """Get specific content by ID"""
    content_item = await db.content.find_one({"id": content_id})
    if not content_item:
        raise HTTPException(status_code=404, detail="Content not found")
    
    content_item = parse_from_mongo(content_item)
    content_response = ContentResponse(**content_item)
    
    # For demo purposes, mark non-free content as locked
    if not content_item["is_free"]:
        content_response.is_locked = True
        content_response.media_urls = []
    
    return content_response

@api_router.get("/creators/{creator_id}/content", response_model=List[ContentResponse]) 
async def get_creator_content(creator_id: str, skip: int = 0, limit: int = 20):
    """Get content by specific creator"""
    return await get_content(skip=skip, limit=limit, creator_id=creator_id)

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()