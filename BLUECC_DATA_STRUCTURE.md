# Blue.cc Data Structure & Import/Export

**Date**: 2026-01-21
**Purpose**: Document the correct data structure for Blue.cc integration

---

## Workspace Hierarchy

```
Company: Inner Allies Academy
├─ Organization ID: clzwnz89g20hbx92uay4mzglv
├─ Organization UID: b7601c606ec54c68918034b06fac01bb
└─ URL: https://blue.cc/org/inner-allies-academy

    └─ Project: PMT
       ├─ Project ID: cmklpzm7k152gp71ee0lm6bwa
       ├─ Project UID: e6af414f10734aff84fe8445c3aecb53
       └─ TodoList: Tasks
          └─ TodoList ID: cmklqbb0z13yjnd1e4pjokze9
```

**Important**: The project is called **"PMT"**, not "InnerAllies"!

---

## CSV Import/Export Format

Blue.cc uses the following CSV structure (from `PMT.csv`):

### Column Headers

```csv
Title,List,Done,Start Date,Due Date,Description,Assignees,Created At,Updated At,Created By,Color,Project,Tags
```

### Field Descriptions

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| **Title** | String | Task title | "Book 4" |
| **List** | String | TodoList name | "Tasks" |
| **Done** | Boolean | Completion status | true/false |
| **Start Date** | Date | When task starts | "2026-01-21" |
| **Due Date** | Date | When task is due | "2026-02-15" |
| **Description** | String | Task description/notes | "Write chapter 1" |
| **Assignees** | String | Assigned users | "W Andersen" |
| **Created At** | DateTime | Creation timestamp | "2026-01-20 12:00:00" |
| **Updated At** | DateTime | Last update timestamp | "2026-01-21 14:30:00" |
| **Created By** | String | Creator name | "W Andersen" |
| **Color** | String | Visual color tag | "#FF6719" |
| **Project** | String | Project name | "PMT" |
| **Tags** | String | Comma-separated tags | "books,content" |

### Example CSV Row

```csv
Book 4,Tasks,false,2026-01-21,2026-02-28,"Write book about project management",,2026-01-20 10:00:00,2026-01-21 11:00:00,W Andersen,#6366F1,PMT,"books,content"
```

---

## API Structure vs CSV Structure

### CSV Format (Blue.cc native)
- Simple flat structure
- Direct import/export
- Limited metadata

### API Format (Our extended structure)
We store additional metadata in the `Description` field as JSON:

```json
{
  "desc": "Human-readable description",
  "workType": "part-of-element",
  "targetOutcome": "Complete the book",
  "activities": [
    {"title": "Chapter 1", "status": "done", "timeEstimate": "4"},
    {"title": "Chapter 2", "status": "in-progress", "timeEstimate": "6"}
  ],
  "resources": {
    "timeEstimate": "20",
    "energyLevel": "Focused work",
    "tools": ["Google Docs", "Grammarly"],
    "materials": "Research notes"
  },
  "position": {"x": 200, "y": 150}
}
```

This allows us to:
- Store rich metadata beyond CSV columns
- Preserve Board view positions
- Track sub-activities
- Record resource requirements
- Maintain compatibility with Blue.cc CSV export

---

## Mapping PMT Fields to Blue.cc

### Direct Mappings

| PMT Field | Blue.cc CSV Column | Blue.cc API Field |
|-----------|-------------------|-------------------|
| `id` | (not exported) | `id` |
| `title` | Title | `title` |
| `status` | Done (boolean) | `done` |
| `startDate` | Start Date | `startedAt` |
| `dueDate` | Due Date | `duedAt` |
| `tags` | Tags (comma-separated) | `tags[]` |
| `createdAt` | Created At | `createdAt` |
| `updatedAt` | Updated At | `updatedAt` |

### Extended Metadata (Stored in Description)

| PMT Field | Storage Location | Format |
|-----------|-----------------|--------|
| `description` | Description (plain text part) | String |
| `workType` | Description (JSON) | "part-of-element" \| "delivery-enabler" |
| `targetOutcome` | Description (JSON) | String |
| `activities` | Description (JSON) | Array<Activity> |
| `resources` | Description (JSON) | Object |
| `position` | Description (JSON) | {x, y} |

---

## Import/Export Workflows

### Export from Blue.cc to PMT

1. **Via CSV**:
   ```bash
   # Download PMT.csv from Blue.cc
   # Parse with our importer (to be created)
   node backend/import-from-bluecc.js PMT.csv
   ```

2. **Via API** (Current method):
   ```javascript
   const result = await blueClient.getTasks();
   const tasks = result.data; // Array of task objects
   ```

### Import from PMT to Blue.cc

1. **Via CSV**:
   ```bash
   # Generate CSV from local tasks
   node backend/export-to-bluecc.js
   # Upload to Blue.cc manually
   ```

2. **Via API** (Current method):
   ```javascript
   await blueClient.createTask({
     title: "Book 4",
     description: JSON.stringify(metadata),
     tags: ["books", "content"],
     startDate: "2026-01-21",
     dueDate: "2026-02-28"
   });
   ```

---

## Best Practices

### 1. Use API for Rich Metadata
- CSV is great for bulk import/export
- API is better for preserving rich metadata
- Use CSV for backups, API for sync

### 2. Description Field Strategy
Store both human-readable text AND JSON metadata:

```javascript
const description = `${humanReadableText}\n\n---\n${JSON.stringify(metadata)}`;
```

This allows:
- Users to read descriptions in Blue.cc UI
- Our app to parse and use rich metadata

### 3. Tag Consistency
Use lowercase, hyphenated tags:
- ✅ `books`, `content`, `part-of-element`
- ❌ `Books`, `Content`, `Part of Element`

### 4. Date Format
Blue.cc expects ISO 8601 dates:
```javascript
startDate: "2026-01-21T09:00:00.000Z"
```

---

## Future Enhancements

### CSV Import/Export Tools

Create utility scripts:

1. **`backend/export-to-csv.js`**
   - Export tasks.json to Blue.cc CSV format
   - Include all standard columns
   - Flatten rich metadata for compatibility

2. **`backend/import-from-csv.js`**
   - Import Blue.cc CSV to tasks.json
   - Parse JSON metadata from Description
   - Reconstruct rich task objects

### Sync Strategy

1. **Initial Load**: API fetch all tasks
2. **Incremental Updates**: API create/update/delete
3. **Backup**: CSV export for disaster recovery
4. **Restore**: CSV import if API unavailable

---

## Testing

### Verify CSV Structure

```bash
# Check CSV headers
head -1 PMT.csv

# Expected output:
# Title,List,Done,Start Date,Due Date,Description,Assignees,Created At,Updated At,Created By,Color,Project,Tags
```

### Verify API Structure

```bash
cd backend
node -e "
import('./blueClient.js').then(async (m) => {
  const result = await m.default.getTasks();
  console.log('Task structure:', JSON.stringify(result.data[0], null, 2));
  process.exit(0);
});"
```

---

## Summary

✅ **Correct Structure**:
```
Company: Inner Allies Academy (clzwnz89g20hbx92uay4mzglv)
  └─ Project: PMT (cmklpzm7k152gp71ee0lm6bwa)
      └─ TodoList: Tasks (cmklqbb0z13yjnd1e4pjokze9)
```

✅ **CSV Format**: 13 columns (Title, List, Done, etc.)

✅ **Rich Metadata**: Stored as JSON in Description field

✅ **Current Method**: API-based sync with automatic backup

This structure supports both:
- Simple CSV import/export for bulk operations
- Rich API integration for full PMT functionality
