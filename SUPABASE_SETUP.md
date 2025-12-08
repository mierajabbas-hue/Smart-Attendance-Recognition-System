# Supabase Setup Guide

This guide will help you connect your Smart Attendance & Recognition System to Supabase (PostgreSQL).

## Prerequisites

- A Supabase account (free tier available at [supabase.com](https://supabase.com))
- Your Supabase project created
- PostgreSQL driver installed (already done ✓)

## Step 1: Get Your Supabase Connection Details

1. **Login to Supabase Dashboard**
   - Go to [app.supabase.com](https://app.supabase.com)
   - Select your project

2. **Get Database Connection String**
   - Navigate to: **Project Settings** → **Database**
   - Scroll down to **Connection String**
   - Select **URI** tab
   - Copy the connection string (it looks like this):
     ```
     postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
     ```

3. **Important Notes:**
   - Replace `[YOUR-PASSWORD]` with your actual database password
   - The connection string includes:
     - **Host**: `db.[PROJECT-REF].supabase.co`
     - **Port**: `5432`
     - **Database**: `postgres`
     - **User**: `postgres`

## Step 2: Update Your .env File

1. **Create or update `.env` file** in your project root:

```bash
cp .env.example .env
```

2. **Edit `.env` file** and update the `DATABASE_URL`:

```env
# Database Settings
# Comment out SQLite
# DATABASE_URL=sqlite:///./database/attendance.db

# Add your Supabase connection string
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**Example:**
```env
DATABASE_URL=postgresql://postgres:MySecurePassword123@db.abcdefghijklmnop.supabase.co:5432/postgres
```

## Step 3: Initialize Database Tables

Once you've updated the `.env` file, initialize the database:

```bash
# Activate virtual environment
source venv/bin/activate

# Initialize database tables
python -c "from backend.database.connection import init_db; init_db()"
```

This will create all necessary tables in your Supabase database:
- `users` - Employee and student records
- `attendance_logs` - Attendance tracking
- `admins` - Admin user accounts
- `unknown_faces` - Unrecognized face logs

## Step 4: Create Admin User

Create your first admin user:

```bash
# Using the setup script
python setup_admin.py

# OR generate sample data (includes admin)
python generate_sample_data.py
```

## Step 5: Restart Your Backend

1. **Stop the current backend** (Ctrl+C in the terminal)

2. **Restart the backend**:
```bash
./run_backend.sh
# OR
source venv/bin/activate && python backend/main.py
```

3. **Verify connection**:
   - Check the terminal for successful startup
   - Visit: http://localhost:8000/docs
   - Try logging in at: http://localhost:3000

## Step 6: Verify Database Tables in Supabase

1. Go to **Supabase Dashboard** → **Table Editor**
2. You should see these tables:
   - `users`
   - `attendance_logs`
   - `admins`
   - `unknown_faces`

## Connection String Format Explained

```
postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]
```

**Supabase Example:**
```
postgresql://postgres:MyPassword123@db.abcdefghijklmnop.supabase.co:5432/postgres
```

**Breaking it down:**
- **Protocol**: `postgresql://`
- **User**: `postgres` (default Supabase user)
- **Password**: Your database password
- **Host**: `db.[PROJECT-REF].supabase.co`
- **Port**: `5432` (PostgreSQL default)
- **Database**: `postgres` (default database)

## Troubleshooting

### Connection Failed

**Error**: `could not connect to server`

**Solution**:
1. Check your internet connection
2. Verify the connection string is correct
3. Ensure your Supabase project is active
4. Check if your IP is allowed (Supabase → Database → Connection Pooling)

### Authentication Failed

**Error**: `password authentication failed`

**Solution**:
1. Double-check your database password
2. Reset password in Supabase Dashboard → Database Settings
3. Update `.env` file with new password

### SSL Required

**Error**: `SSL connection required`

**Solution**: Add `?sslmode=require` to your connection string:
```env
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres?sslmode=require
```

### Tables Already Exist

**Error**: `relation already exists`

**Solution**: This is normal if tables were created before. The app will use existing tables.

## Migration from SQLite to Supabase

If you have existing data in SQLite that you want to migrate:

1. **Export data from SQLite** (use the CSV export feature)
2. **Import to Supabase** via Supabase Dashboard → Table Editor → Import data

Or use the migration script:
```bash
python migrate_to_supabase.py
```

## Security Best Practices

1. **Never commit `.env` file** to git
2. **Use strong passwords** for database
3. **Enable Row Level Security (RLS)** in Supabase for additional protection
4. **Rotate passwords** regularly
5. **Use connection pooling** for production (Supabase provides this)

## Connection Pooling (Recommended for Production)

For production, use Supabase's connection pooler:

1. Go to **Supabase Dashboard** → **Database** → **Connection Pooling**
2. Use the **Transaction Mode** connection string
3. Update your `.env`:

```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@[PROJECT-REF].pooler.supabase.com:5432/postgres?sslmode=require
```

## Benefits of Using Supabase

✅ **Cloud-hosted** - No need to manage your own database server
✅ **Automatic backups** - Daily backups included
✅ **Scalable** - Grows with your application
✅ **Real-time features** - Built-in real-time subscriptions
✅ **Dashboard** - Easy data management via web interface
✅ **Free tier** - 500MB database, 2GB bandwidth

## Need Help?

- Supabase Documentation: https://supabase.com/docs
- PostgreSQL Documentation: https://www.postgresql.org/docs/
- Project Issues: Check README.md

## Quick Reference

**Get Supabase Connection String:**
Supabase Dashboard → Settings → Database → Connection String → URI

**Default Credentials:**
- User: `postgres`
- Database: `postgres`
- Port: `5432`
- Password: Your project's database password

**Test Connection:**
```bash
python -c "from backend.database.connection import engine; engine.connect(); print('✓ Connected to Supabase!')"
```

---

**Ready to go!** Your application should now be connected to Supabase. 🚀
