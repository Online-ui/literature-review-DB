import os
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models.user import User
from app.models.base import Base
from app.core.security import get_password_hash

def create_admin():
    """Create admin user if it doesn't exist"""
    
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Check if admin already exists
        admin = db.query(User).filter(User.username == "admin").first()
        if admin:
            print("✅ Admin user already exists")
            print(f"   Username: {admin.username}")
            print(f"   Email: {admin.email}")
            print(f"   Role: {admin.role}")
            return
        
        # Get admin credentials from environment or use defaults
        admin_username = os.getenv("ADMIN_USERNAME", "admin")
        admin_password = os.getenv("ADMIN_PASSWORD", "aFGWREGF")
        admin_email = os.getenv("ADMIN_EMAIL", "admin@literature-db.com")
        
        # Create admin user
        admin_user = User(
            username=admin_username,
            email=admin_email,
            full_name="Main Administrator",
            hashed_password=get_password_hash(admin_password),
            role="main_coordinator",
            is_active=True,
            institution="Literature Review Database",
            department="Administration"
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print("🎉 Admin user created successfully!")
        print(f"   Username: {admin_username}")
        print(f"   Email: {admin_email}")
        print(f"   Role: {admin_user.role}")
        print("")
        print("⚠️  IMPORTANT: Change the default password after first login!")
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        db.rollback()
        # Don't fail the build if admin creation fails
        print("⚠️  Continuing with deployment...")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
