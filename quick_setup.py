#!/usr/bin/env python3
"""
Quick Supabase Setup
Pre-configured for project: ibbdiuqcnlfenqwnqcsx
"""
import os
import getpass
from pathlib import Path

# ANSI colors
GREEN = '\033[92m'
YELLOW = '\033[93m'
RED = '\033[91m'
BLUE = '\033[94m'
CYAN = '\033[96m'
BOLD = '\033[1m'
RESET = '\033[0m'

# Your project details
PROJECT_REF = "ibbdiuqcnlfenqwnqcsx"
HOST = f"db.{PROJECT_REF}.supabase.co"

def main():
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BOLD}{CYAN}   Quick Supabase Setup{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")

    print(f"{CYAN}Project Reference:{RESET} {BOLD}{PROJECT_REF}{RESET}")
    print(f"{CYAN}Database Host:{RESET} {BOLD}{HOST}{RESET}\n")

    # Get database password
    print(f"{YELLOW}Enter your Supabase DATABASE PASSWORD:{RESET}")
    print(f"{CYAN}(This is in: Settings → Database → Database Password){RESET}")
    print(f"{YELLOW}If you don't know it, reset it in Supabase Dashboard first.{RESET}\n")

    password = getpass.getpass("Database Password (hidden): ")

    if not password:
        print(f"{RED}✗ Password cannot be empty{RESET}")
        return

    # Build connection string
    connection_string = f"postgresql://postgres:{password}@{HOST}:5432/postgres"

    # Test connection
    print(f"\n{BLUE}Testing connection...{RESET}")
    try:
        from sqlalchemy import create_engine
        engine = create_engine(connection_string)
        conn = engine.connect()
        conn.close()
        print(f"{GREEN}✓ Connection successful!{RESET}")
    except Exception as e:
        print(f"{RED}✗ Connection failed: {str(e)}{RESET}")
        print(f"\n{YELLOW}Please check:{RESET}")
        print(f"  • Password is correct")
        print(f"  • Internet connection is working")
        print(f"  • Supabase project is active")
        return

    # Update .env file
    print(f"\n{BLUE}Updating .env file...{RESET}")

    env_path = Path(".env")

    # Read existing or create from example
    if env_path.exists():
        with open(env_path, 'r') as f:
            content = f.read()
    elif Path(".env.example").exists():
        with open(".env.example", 'r') as f:
            content = f.read()
    else:
        content = ""

    # Comment out SQLite
    content = content.replace(
        'DATABASE_URL=sqlite:///./database/attendance.db',
        '# DATABASE_URL=sqlite:///./database/attendance.db'
    )

    # Add Supabase connection
    lines = content.split('\n')
    new_lines = []
    added = False

    for line in lines:
        if line.startswith('DATABASE_URL=') and 'sqlite' not in line:
            # Replace existing PostgreSQL URL
            new_lines.append(f'DATABASE_URL={connection_string}')
            added = True
        elif '# DATABASE_URL=sqlite' in line:
            new_lines.append(line)
            if not added:
                new_lines.append(f'DATABASE_URL={connection_string}')
                added = True
        else:
            new_lines.append(line)

    if not added:
        new_lines.append(f'\n# Supabase Database')
        new_lines.append(f'DATABASE_URL={connection_string}')

    # Write .env
    with open(env_path, 'w') as f:
        f.write('\n'.join(new_lines))

    print(f"{GREEN}✓ .env file updated{RESET}")

    # Initialize database
    print(f"\n{BLUE}Creating database tables...{RESET}")
    try:
        from backend.database.connection import init_db
        init_db()
        print(f"{GREEN}✓ Database tables created{RESET}")
    except Exception as e:
        print(f"{RED}✗ Failed to create tables: {str(e)}{RESET}")
        return

    # Create admin
    print(f"\n{YELLOW}Create admin user? [Y/n]:{RESET} ", end='')
    if input().strip().lower() in ['', 'y', 'yes']:
        print()
        username = input("Admin username: ").strip() or "admin"
        email = input("Admin email: ").strip() or "admin@example.com"
        admin_password = getpass.getpass("Admin password: ")
        full_name = input("Full name (optional): ").strip() or username

        try:
            from backend.database.connection import SessionLocal
            from backend.models.models import Admin
            from backend.utils.auth import get_password_hash

            db = SessionLocal()

            # Check if exists
            existing = db.query(Admin).filter(Admin.username == username).first()
            if existing:
                print(f"{YELLOW}⚠ Admin '{username}' already exists{RESET}")
            else:
                admin = Admin(
                    username=username,
                    email=email,
                    hashed_password=get_password_hash(admin_password),
                    full_name=full_name,
                    is_superuser=True
                )
                db.add(admin)
                db.commit()
                print(f"{GREEN}✓ Admin user created{RESET}")

            db.close()
        except Exception as e:
            print(f"{RED}✗ Failed to create admin: {str(e)}{RESET}")

    # Success!
    print(f"\n{GREEN}{'='*60}{RESET}")
    print(f"{BOLD}{GREEN}Setup Complete! 🎉{RESET}")
    print(f"{GREEN}{'='*60}{RESET}\n")

    print(f"{CYAN}Next Steps:{RESET}\n")
    print(f"  1. {BOLD}Restart your backend:{RESET}")
    print(f"     Press Ctrl+C, then run: {YELLOW}./run_backend.sh{RESET}\n")
    print(f"  2. {BOLD}Access your app:{RESET}")
    print(f"     Frontend: {YELLOW}http://localhost:3000{RESET}")
    print(f"     API: {YELLOW}http://localhost:8000/docs{RESET}\n")
    print(f"  3. {BOLD}View data in Supabase:{RESET}")
    print(f"     {YELLOW}https://app.supabase.com{RESET} → Table Editor\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n\n{YELLOW}Setup cancelled{RESET}")
    except Exception as e:
        print(f"\n{RED}Setup failed: {str(e)}{RESET}")
