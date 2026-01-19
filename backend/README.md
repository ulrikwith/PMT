# Backend Data Storage

## Database File

`tasks.json` - This file contains your project data and is **not tracked by git** to preserve your work data during development.

### Initial Setup

If you're setting up the project for the first time:

1. Copy the template file:
   ```bash
   cp backend/tasks.json.template backend/tasks.json
   ```

2. Start the backend server:
   ```bash
   npm run dev
   ```

### Important Notes

- **tasks.json is gitignored** - Your local data will never be committed to the repository
- This prevents accidental data loss during development
- Each developer/environment maintains their own data
- For production, use a proper database service (Blue.cc or similar)

### Data Structure

The tasks.json file follows this structure:
```json
{
  "tasks": [
    {
      "id": 1,
      "title": "Task title",
      "description": "Task description",
      "tags": ["dimension", "element"],
      "status": "To do",
      "dueDate": "2026-01-20",
      "workType": "part-of-element",
      "activities": [],
      "resources": {}
    }
  ],
  "nextId": 2
}
```
