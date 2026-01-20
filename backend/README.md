# Backend Data Storage

## Current Status: Local Storage Mode

The app is currently running in **local storage mode** using `tasks.json`. Blue.cc API connection works, but full cloud sync is not yet enabled.

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

## Blue.cc Integration Status

### What's Working
- ✅ API authentication (tokens are valid)
- ✅ Can query company and project information
- ✅ Rich metadata serialization prepared (activities, resources, workType, position)

### What Needs Setup
The Blue.cc GraphQL API is returning "Company not found" or "Project not found" errors when trying to access todoLists and todos. This suggests the Blue.cc workspace needs additional configuration.

**Possible Issues:**
1. The company/project may need specific permissions or settings enabled in Blue.cc web UI
2. TodoLists may need to be created manually in the Blue.cc interface first
3. The API may require additional headers or authentication beyond what we're using

**To Enable Cloud Sync:**
1. Log into your Blue.cc account at https://blue.cc
2. Verify your "Inner Allies Academy" company is properly set up
3. Check that projects like "Book Writing" have at least one todo list created
4. Contact Blue.cc support if queries continue to fail with "not found" errors

Once cloud sync is working, all your local data can be migrated to Blue.cc automatically.

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
