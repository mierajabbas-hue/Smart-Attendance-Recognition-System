#!/usr/bin/env python3
"""
Interactive Supabase Setup Script

This script will help you securely configure your Supabase connection.
Your credentials will only be stored locally in your .env file.

Usage:
    python setup_supabase.py
"""
import os
import sys
import getpass
from pathlib import Path

# ANSI color codes
GREEN = '\033[92m'
YELLOW = '\033[93m'
RED = '\033[91m'
BLUE = '\033[94m'
CYAN = '\033[96m'
BOLD = '\033[1m'
RESET = '\033[0m'


def print_header():
    """Print welcome header"""
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BOLD}{CYAN}   Supabase Setup Wizard for Smart Attendance System{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")


def print_step(step_num, title):
    """Print step header"""
    print(f"\n{BOLD}{BLUE}Step {step_num}: {title}{RESET}")
    print(f"{BLUE}{'─'*60}{RESET}")


def get_supabase_info():
    """Get Supabase connection information from user"""

    print(f"{YELLOW}I'll help you build your Supabase connection string.{RESET}\n")

    print(f"{CYAN}Where to find this information:{RESET}")
    print(f"  1. Go to: {BOLD}https://app.supabase.com{RESET}")
    print(f"  2. Select your project")
    print(f"  3. Go to: {BOLD}Settings → Database{RESET}")
    print(f"  4. Scroll to: {BOLD}Connection String → URI{RESET}\n")

    # Get connection string option
    print(f"{YELLOW}Choose your setup method:{RESET}")
    print(f"  {BOLD}1{RESET}. Paste full connection string (Easy)")
    print(f"  {BOLD}2{RESET}. Enter details manually (Advanced)")

    choice = input(f"\nEnter choice [1/2] (default: 1): ").strip() or "1"

    if choice == "1":
        return get_full_connection_string()
    else:
        return get_manual_connection_details()


def get_full_connection_string():
    """Get full connection string from user"""
    print(f"\n{CYAN}Paste your Supabase connection string:{RESET}")
    print(f"{YELLOW}Example:{RESET} postgresql://postgres:password@db.xxx.supabase.co:5432/postgres\n")

    connection_string = input("Connection string: ").strip()

    # Validate
    if not connection_string.startswith('postgresql://'):
        print(f"{RED}✗ Invalid connection string. Must start with 'postgresql://'{RESET}")
        return None

    if '[YOUR-PASSWORD]' in connection_string or '[PASSWORD]' in connection_string:
        print(f"\n{YELLOW}⚠ It looks like you need to replace the password placeholder!{RESET}")
        password = getpass.getpass("Enter your Supabase database password: ")
        connection_string = connection_string.replace('[YOUR-PASSWORD]', password)
        connection_string = connection_string.replace('[PASSWORD]', password)

    return connection_string


def get_manual_connection_details():
    """Get connection details manually"""
    print(f"\n{CYAN}Enter your Supabase connection details:{RESET}\n")

    # Get project reference
    print(f"{YELLOW}Your project reference is in the connection string:{RESET}")
    print(f"  Format: db.{BOLD}PROJECT_REF{RESET}.supabase.co")
    project_ref = input(f"\nProject Reference (e.g., abcdefghijklmnop): ").strip()

    # Get password
    password = getpass.getpass("Database Password (hidden): ")

    # Build connection string
    host = f"db.{project_ref}.supabase.co"
    connection_string = f"postgresql://postgres:{password}@{host}:5432/postgres"

    return connection_string


def test_connection(connection_string):
    """Test database connection"""
    print(f"\n{BLUE}Testing connection to Supabase...{RESET}")

    try:
        from sqlalchemy import create_engine

        # Try to connect
        engine = create_engine(connection_string)
        connection = engine.connect()
        connection.close()

        print(f"{GREEN}✓ Connection successful!{RESET}")
        return True

    except ImportError:
        print(f"{YELLOW}⚠ Cannot test connection (SQLAlchemy not available){RESET}")
        print(f"{YELLOW}  Connection string will be saved, but please test manually{RESET}")
        return True

    except Exception as e:
        print(f"{RED}✗ Connection failed: {str(e)}{RESET}\n")
        print(f"{YELLOW}Common issues:{RESET}")
        print(f"  • Check your password is correct")
        print(f"  • Verify your internet connection")
        print(f"  • Ensure Supabase project is active")
        print(f"  • Check firewall settings")
        return False


def update_env_file(connection_string):
    """Update .env file with Supabase connection string"""

    env_path = Path(".env")

    # Read existing .env or create from example
    if env_path.exists():
        with open(env_path, 'r') as f:
            env_content = f.read()
    elif Path(".env.example").exists():
        with open(".env.example", 'r') as f:
            env_content = f.read()
        print(f"{YELLOW}Created .env from .env.example{RESET}")
    else:
        env_content = ""

    # Update or add DATABASE_URL
    if 'DATABASE_URL=' in env_content:
        # Comment out SQLite
        env_content = env_content.replace(
            'DATABASE_URL=sqlite:///./database/attendance.db',
            '# DATABASE_URL=sqlite:///./database/attendance.db'
        )

        # Check if Supabase URL already exists
        lines = env_content.split('\n')
        updated = False
        new_lines = []

        for line in lines:
            if line.startswith('DATABASE_URL=postgresql://'):
                # Replace existing PostgreSQL URL
                new_lines.append(f'DATABASE_URL={connection_string}')
                updated = True
            elif line.startswith('# DATABASE_URL=postgresql://'):
                # Skip commented PostgreSQL URL
                if not updated:
                    new_lines.append(f'DATABASE_URL={connection_string}')
                    updated = True
            else:
                new_lines.append(line)

        if not updated:
            # Add after SQLite line
            for i, line in enumerate(new_lines):
                if 'sqlite' in line.lower():
                    new_lines.insert(i + 1, f'DATABASE_URL={connection_string}')
                    break

        env_content = '\n'.join(new_lines)
    else:
        # Add DATABASE_URL
        env_content += f'\n\n# Database\nDATABASE_URL={connection_string}\n'

    # Write .env file
    with open(env_path, 'w') as f:
        f.write(env_content)

    print(f"{GREEN}✓ Updated .env file{RESET}")


def initialize_database():
    """Initialize database tables"""
    print(f"\n{BLUE}Initializing database tables in Supabase...{RESET}")

    try:
        from backend.database.connection import init_db

        init_db()
        print(f"{GREEN}✓ Database tables created successfully{RESET}")
        return True

    except Exception as e:
        print(f"{RED}✗ Failed to initialize database: {str(e)}{RESET}")
        return False


def create_admin_user():
    """Prompt to create admin user"""
    print(f"\n{YELLOW}Would you like to create an admin user now?{RESET}")
    create = input("Create admin? [Y/n]: ").strip().lower()

    if create in ['', 'y', 'yes']:
        print(f"\n{CYAN}Creating admin user...{RESET}\n")

        username = input("Admin username: ").strip()
        email = input("Admin email: ").strip()
        password = getpass.getpass("Admin password: ")
        full_name = input("Full name (optional): ").strip()

        try:
            from backend.database.connection import SessionLocal
            from backend.models.models import Admin
            from backend.utils.auth import get_password_hash

            db = SessionLocal()

            # Check if admin exists
            existing = db.query(Admin).filter(Admin.username == username).first()
            if existing:
                print(f"{YELLOW}⚠ Admin user '{username}' already exists{RESET}")
                db.close()
                return

            # Create admin
            admin = Admin(
                username=username,
                email=email,
                hashed_password=get_password_hash(password),
                full_name=full_name or username,
                is_superuser=True
            )

            db.add(admin)
            db.commit()
            db.close()

            print(f"{GREEN}✓ Admin user created successfully{RESET}")
            print(f"\n{CYAN}Login credentials:{RESET}")
            print(f"  Username: {BOLD}{username}{RESET}")
            print(f"  Password: {BOLD}{'*' * len(password)}{RESET}")

        except Exception as e:
            print(f"{RED}✗ Failed to create admin: {str(e)}{RESET}")
            print(f"{YELLOW}You can create admin later using: python setup_admin.py{RESET}")


def print_next_steps():
    """Print next steps"""
    print(f"\n{GREEN}{'='*60}{RESET}")
    print(f"{BOLD}{GREEN}Setup Complete! 🎉{RESET}")
    print(f"{GREEN}{'='*60}{RESET}\n")

    print(f"{CYAN}Next Steps:{RESET}\n")
    print(f"  1. {BOLD}Restart your backend server:{RESET}")
    print(f"     Press Ctrl+C in the terminal running the backend")
    print(f"     Then run: {YELLOW}./run_backend.sh{RESET}\n")

    print(f"  2. {BOLD}Access your application:{RESET}")
    print(f"     Frontend: {YELLOW}http://localhost:3000{RESET}")
    print(f"     API Docs: {YELLOW}http://localhost:8000/docs{RESET}\n")

    print(f"  3. {BOLD}View your data in Supabase:{RESET}")
    print(f"     Go to: {YELLOW}https://app.supabase.com{RESET}")
    print(f"     Navigate to: Table Editor\n")

    print(f"{CYAN}Optional:{RESET}\n")
    print(f"  • Migrate existing data: {YELLOW}python migrate_to_supabase.py{RESET}")
    print(f"  • Create admin user: {YELLOW}python setup_admin.py{RESET}")
    print(f"  • Generate sample data: {YELLOW}python generate_sample_data.py{RESET}\n")


def main():
    """Main setup flow"""
    try:
        print_header()

        # Step 1: Get Supabase connection info
        print_step(1, "Get Supabase Connection Details")
        connection_string = get_supabase_info()

        if not connection_string:
            print(f"\n{RED}Setup cancelled{RESET}")
            return

        # Step 2: Test connection
        print_step(2, "Test Connection")
        if not test_connection(connection_string):
            retry = input(f"\n{YELLOW}Retry with different credentials? [y/N]: {RESET}").strip().lower()
            if retry == 'y':
                return main()
            else:
                print(f"\n{RED}Setup cancelled{RESET}")
                return

        # Step 3: Update .env
        print_step(3, "Update Configuration")
        update_env_file(connection_string)

        # Step 4: Initialize database
        print_step(4, "Initialize Database")
        if not initialize_database():
            print(f"\n{YELLOW}You can initialize manually later using:{RESET}")
            print(f"  python -c \"from backend.database.connection import init_db; init_db()\"")

        # Step 5: Create admin user
        print_step(5, "Create Admin User")
        create_admin_user()

        # Done!
        print_next_steps()

    except KeyboardInterrupt:
        print(f"\n\n{YELLOW}Setup cancelled by user{RESET}")
        sys.exit(0)
    except Exception as e:
        print(f"\n{RED}Setup failed: {str(e)}{RESET}")
        sys.exit(1)


if __name__ == "__main__":
    main()
