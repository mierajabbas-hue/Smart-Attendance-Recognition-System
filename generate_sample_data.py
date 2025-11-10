"""
Script to generate sample test data for demonstration
Note: This creates sample users WITHOUT face encodings (for testing database/API)
For real face recognition, you need to add users through the web interface with photos
"""
from datetime import datetime, timedelta
import random
from backend.database.connection import SessionLocal, init_db
from backend.models.models import User, AttendanceLog, Admin
from backend.utils.auth import get_password_hash


def generate_sample_data():
    """Generate sample data for testing"""
    print("=== Generating Sample Data ===\n")

    # Initialize database
    init_db()
    db = SessionLocal()

    try:
        # Create admin if not exists
        admin = db.query(Admin).filter(Admin.username == "admin").first()
        if not admin:
            admin = Admin(
                username="admin",
                email="admin@example.com",
                full_name="System Administrator",
                hashed_password=get_password_hash("admin123"),
                is_superuser=True
            )
            db.add(admin)
            print("✓ Created admin user (username: admin, password: admin123)")

        # Sample users data
        sample_users = [
            {
                "user_id": "EMP001",
                "name": "John Doe",
                "email": "john.doe@company.com",
                "role": "employee",
                "department": "IT Department"
            },
            {
                "user_id": "EMP002",
                "name": "Jane Smith",
                "email": "jane.smith@company.com",
                "role": "employee",
                "department": "HR Department"
            },
            {
                "user_id": "EMP003",
                "name": "Mike Johnson",
                "email": "mike.johnson@company.com",
                "role": "employee",
                "department": "IT Department"
            },
            {
                "user_id": "STU001",
                "name": "Alice Brown",
                "email": "alice.brown@school.com",
                "role": "student",
                "department": "Computer Science"
            },
            {
                "user_id": "STU002",
                "name": "Bob Wilson",
                "email": "bob.wilson@school.com",
                "role": "student",
                "department": "Engineering"
            },
            {
                "user_id": "STU003",
                "name": "Carol Davis",
                "email": "carol.davis@school.com",
                "role": "student",
                "department": "Computer Science"
            },
        ]

        # Create users
        created_users = []
        for user_data in sample_users:
            existing = db.query(User).filter(User.user_id == user_data["user_id"]).first()
            if not existing:
                user = User(**user_data)
                db.add(user)
                created_users.append(user)

        db.commit()

        # Refresh to get IDs
        for user in created_users:
            db.refresh(user)

        print(f"✓ Created {len(created_users)} sample users")

        # Generate sample attendance logs for the past 7 days
        all_users = db.query(User).all()
        attendance_logs = []

        for day in range(7):
            date = datetime.utcnow() - timedelta(days=day)

            # Random attendance for each user (70% chance)
            for user in all_users:
                if random.random() < 0.7:
                    # Entry time (8-10 AM)
                    entry_time = date.replace(
                        hour=random.randint(8, 10),
                        minute=random.randint(0, 59),
                        second=random.randint(0, 59)
                    )

                    log = AttendanceLog(
                        user_id=user.id,
                        timestamp=entry_time,
                        event_type="entry",
                        camera_id="default",
                        confidence=random.uniform(0.85, 0.98),
                        location="Main Entrance"
                    )
                    attendance_logs.append(log)

                    # Exit time (5-7 PM) - 80% chance
                    if random.random() < 0.8:
                        exit_time = date.replace(
                            hour=random.randint(17, 19),
                            minute=random.randint(0, 59),
                            second=random.randint(0, 59)
                        )

                        log = AttendanceLog(
                            user_id=user.id,
                            timestamp=exit_time,
                            event_type="exit",
                            camera_id="default",
                            confidence=random.uniform(0.85, 0.98),
                            location="Main Entrance"
                        )
                        attendance_logs.append(log)

        db.add_all(attendance_logs)
        db.commit()

        print(f"✓ Generated {len(attendance_logs)} sample attendance logs")
        print(f"\nSample data generation complete!")
        print(f"\nIMPORTANT: These users don't have face encodings.")
        print(f"To test face recognition, add users through the web interface with photos.")
        print(f"\nLogin credentials:")
        print(f"  Username: admin")
        print(f"  Password: admin123")

    except Exception as e:
        db.rollback()
        print(f"\nError generating sample data: {str(e)}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    generate_sample_data()
