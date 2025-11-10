"""
Script to create an admin user for the system
"""
import sys
from backend.database.connection import SessionLocal, init_db
from backend.models.models import Admin
from backend.utils.auth import get_password_hash


def create_admin():
    """Create an admin user"""
    print("=== Smart Attendance System - Admin Setup ===\n")

    # Initialize database
    print("Initializing database...")
    init_db()
    print("Database initialized.\n")

    db = SessionLocal()

    try:
        # Get admin details
        username = input("Enter admin username (default: admin): ").strip() or "admin"

        # Check if username exists
        existing = db.query(Admin).filter(Admin.username == username).first()
        if existing:
            print(f"\nError: Username '{username}' already exists!")
            sys.exit(1)

        email = input("Enter admin email: ").strip()
        if not email:
            print("\nError: Email is required!")
            sys.exit(1)

        full_name = input("Enter full name (optional): ").strip()
        password = input("Enter password: ").strip()
        if not password:
            print("\nError: Password is required!")
            sys.exit(1)

        # Create admin
        admin = Admin(
            username=username,
            email=email,
            full_name=full_name if full_name else None,
            hashed_password=get_password_hash(password),
            is_superuser=True
        )

        db.add(admin)
        db.commit()

        print(f"\n✓ Admin user created successfully!")
        print(f"  Username: {username}")
        print(f"  Email: {email}")
        print(f"\nYou can now login to the dashboard with these credentials.")

    except Exception as e:
        db.rollback()
        print(f"\nError creating admin: {str(e)}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    create_admin()
