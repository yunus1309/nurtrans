from app.database import SessionLocal
from app.models import User, RoleEnum
from app.auth import get_password_hash
import os

def init_admin():
    db = SessionLocal()
    try:
        admin_username = os.getenv("ADMIN_USERNAME", "admin")
        admin_password = os.getenv("ADMIN_PASSWORD", "admin")

        # Check if admin user exists
        admin = db.query(User).filter(User.username == admin_username).first()
        if not admin:
            print(f"Creating default admin user: {admin_username} / {admin_password}")
            new_admin = User(
                username=admin_username,
                hashed_password=get_password_hash(admin_password),
                role=RoleEnum.admin,
                is_active=True
            )
            db.add(new_admin)
            db.commit()
            print("Default admin user created successfully.")
        else:
            print("Admin user already exists. Skipping creation.")

    except Exception as e:
        print(f"Error initializing admin user: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    init_admin()
