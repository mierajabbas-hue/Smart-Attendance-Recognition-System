"""
Script to migrate data from SQLite to Supabase (PostgreSQL)

This script helps you transfer all data from your local SQLite database
to your Supabase PostgreSQL database.

Usage:
    1. Ensure your .env file has the Supabase DATABASE_URL
    2. Run: python migrate_to_supabase.py
"""
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.models.models import User, AttendanceLog, Admin, UnknownFace
from backend.database.connection import Base

# ANSI color codes for terminal output
GREEN = '\033[92m'
YELLOW = '\033[93m'
RED = '\033[91m'
BLUE = '\033[94m'
RESET = '\033[0m'


def migrate_data():
    """Migrate data from SQLite to PostgreSQL/Supabase"""

    print(f"\n{BLUE}=== Database Migration Tool ==={RESET}\n")
    print("This script will migrate data from SQLite to Supabase (PostgreSQL)\n")

    # Source database (SQLite)
    sqlite_path = input(f"Enter SQLite database path [{YELLOW}./database/attendance.db{RESET}]: ").strip()
    if not sqlite_path:
        sqlite_path = "./database/attendance.db"

    if not os.path.exists(sqlite_path):
        print(f"{RED}✗ SQLite database not found at: {sqlite_path}{RESET}")
        return

    # Destination database (Supabase/PostgreSQL)
    print(f"\n{YELLOW}Enter your Supabase connection string:{RESET}")
    print("Example: postgresql://postgres:password@db.xxx.supabase.co:5432/postgres")
    postgres_url = input("Connection string: ").strip()

    if not postgres_url or not postgres_url.startswith('postgresql://'):
        print(f"{RED}✗ Invalid PostgreSQL connection string{RESET}")
        return

    try:
        # Create engines
        print(f"\n{BLUE}Connecting to databases...{RESET}")
        sqlite_engine = create_engine(f"sqlite:///{sqlite_path}")
        postgres_engine = create_engine(postgres_url)

        # Create sessions
        SqliteSession = sessionmaker(bind=sqlite_engine)
        PostgresSession = sessionmaker(bind=postgres_engine)

        sqlite_session = SqliteSession()
        postgres_session = PostgresSession()

        print(f"{GREEN}✓ Connected to both databases{RESET}")

        # Create tables in PostgreSQL
        print(f"\n{BLUE}Creating tables in Supabase...{RESET}")
        Base.metadata.create_all(bind=postgres_engine)
        print(f"{GREEN}✓ Tables created{RESET}")

        # Migrate Admins
        print(f"\n{BLUE}Migrating admin users...{RESET}")
        admins = sqlite_session.query(Admin).all()
        for admin in admins:
            # Check if admin already exists
            existing = postgres_session.query(Admin).filter(Admin.username == admin.username).first()
            if not existing:
                postgres_session.add(Admin(
                    username=admin.username,
                    email=admin.email,
                    hashed_password=admin.hashed_password,
                    full_name=admin.full_name,
                    is_active=admin.is_active,
                    is_superuser=admin.is_superuser,
                    created_at=admin.created_at,
                    last_login=admin.last_login
                ))
        postgres_session.commit()
        print(f"{GREEN}✓ Migrated {len(admins)} admin users{RESET}")

        # Migrate Users
        print(f"\n{BLUE}Migrating users (employees & students)...{RESET}")
        users = sqlite_session.query(User).all()
        user_id_mapping = {}  # To map old IDs to new IDs

        for user in users:
            # Check if user already exists
            existing = postgres_session.query(User).filter(User.user_id == user.user_id).first()
            if not existing:
                new_user = User(
                    user_id=user.user_id,
                    name=user.name,
                    email=user.email,
                    role=user.role,
                    department=user.department,
                    photo_path=user.photo_path,
                    face_encoding_path=user.face_encoding_path,
                    is_active=user.is_active,
                    created_at=user.created_at,
                    updated_at=user.updated_at
                )
                postgres_session.add(new_user)
                postgres_session.flush()  # Get the new ID
                user_id_mapping[user.id] = new_user.id
            else:
                user_id_mapping[user.id] = existing.id

        postgres_session.commit()
        print(f"{GREEN}✓ Migrated {len(users)} users{RESET}")

        # Migrate Attendance Logs
        print(f"\n{BLUE}Migrating attendance logs...{RESET}")
        logs = sqlite_session.query(AttendanceLog).all()
        migrated_logs = 0

        for log in logs:
            # Use the mapped user ID
            new_user_id = user_id_mapping.get(log.user_id)
            if new_user_id:
                # Check if log already exists (avoid duplicates)
                existing_log = postgres_session.query(AttendanceLog).filter(
                    AttendanceLog.user_id == new_user_id,
                    AttendanceLog.timestamp == log.timestamp
                ).first()

                if not existing_log:
                    postgres_session.add(AttendanceLog(
                        user_id=new_user_id,
                        timestamp=log.timestamp,
                        event_type=log.event_type,
                        camera_id=log.camera_id,
                        confidence=log.confidence,
                        image_path=log.image_path,
                        location=log.location,
                        created_at=log.created_at
                    ))
                    migrated_logs += 1

        postgres_session.commit()
        print(f"{GREEN}✓ Migrated {migrated_logs} attendance logs{RESET}")

        # Migrate Unknown Faces
        print(f"\n{BLUE}Migrating unknown faces...{RESET}")
        unknown_faces = sqlite_session.query(UnknownFace).all()
        migrated_faces = 0

        for face in unknown_faces:
            # Check if entry already exists
            existing_face = postgres_session.query(UnknownFace).filter(
                UnknownFace.timestamp == face.timestamp,
                UnknownFace.camera_id == face.camera_id
            ).first()

            if not existing_face:
                postgres_session.add(UnknownFace(
                    timestamp=face.timestamp,
                    camera_id=face.camera_id,
                    image_path=face.image_path,
                    location=face.location,
                    notes=face.notes,
                    created_at=face.created_at
                ))
                migrated_faces += 1

        postgres_session.commit()
        print(f"{GREEN}✓ Migrated {migrated_faces} unknown face records{RESET}")

        # Summary
        print(f"\n{GREEN}{'='*50}{RESET}")
        print(f"{GREEN}Migration completed successfully!{RESET}")
        print(f"{GREEN}{'='*50}{RESET}\n")
        print(f"Summary:")
        print(f"  • Admins: {len(admins)}")
        print(f"  • Users: {len(users)}")
        print(f"  • Attendance Logs: {migrated_logs}")
        print(f"  • Unknown Faces: {migrated_faces}")
        print(f"\n{YELLOW}Next steps:{RESET}")
        print(f"  1. Update your .env file with the Supabase connection string")
        print(f"  2. Restart your backend server")
        print(f"  3. Test the application at http://localhost:3000")

        # Close sessions
        sqlite_session.close()
        postgres_session.close()

    except Exception as e:
        print(f"\n{RED}✗ Migration failed: {str(e)}{RESET}")
        if 'postgres_session' in locals():
            postgres_session.rollback()
        sys.exit(1)


if __name__ == "__main__":
    try:
        migrate_data()
    except KeyboardInterrupt:
        print(f"\n\n{YELLOW}Migration cancelled by user{RESET}")
        sys.exit(0)
