from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import Base, User
from app.core.security import get_password_hash

# Create tables
Base.metadata.create_all(bind=engine)

def create_admin_user():
    db = SessionLocal()
    try:
        # Check if admin already exists
        admin = db.query(User).filter(User.username == "admin").first()
        if admin:
            print("Admin user already exists")
            return
        
        # Create admin user
        admin_user = User(
            username="admin",
            email="admin@literature-db.com",
            full_name="Main Administrator",
            hashed_password=get_password_hash("admin123"),  # Change this!
            role="main_coordinator",
            is_active=True
        )
        
        db.add(admin_user)
        db.commit()
        print("Admin user created successfully!")
        print("Username: admin")
        print("Password: admin123")
        print("Please change the password after first login!")
        
    except Exception as e:
        print(f"Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()