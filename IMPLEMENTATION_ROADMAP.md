# PMT Implementation Roadmap
## Building Process-Oriented Project Management

**Based on**: PROCESS_ORIENTED_PM_MANIFESTO.md
**Status**: Foundation Complete, Core Features Ready for Enhancement
**Last Updated**: 2026-01-21

---

## Vision Alignment

### What We're Building

**Process-Oriented Project Management (POPM)** - A fundamentally different approach to managing creative, meaningful work for people who think in contexts, flows, and meaning-containers.

### Core Philosophy

- **Work-first, not task-first**: Start with meaningful work-products
- **Context always visible**: Never lose the "why"
- **Visual-spatial thinking**: Canvas as primary interface
- **Emergent structure**: Build organically, not by imposed plan
- **Sustained engagement**: Meaning drives completion

---

## Current State Assessment

### ✅ What's Already Built (v1.0 Foundation)

#### Backend Infrastructure
- ✅ Express API with full CRUD
- ✅ Blue.cc cloud sync (hybrid storage)
- ✅ Rich metadata support
- ✅ Tag system (dimensions & elements)
- ✅ Task relationships
- ✅ Activities as sub-tasks

#### Frontend Components
- ✅ Tasks View (list interface)
- ✅ Board View (visual canvas) - **CORE POPM FEATURE**
- ✅ Timeline View (Gantt chart)
- ✅ Readiness View (dashboard)
- ✅ Unified TasksContext (single source of truth)

#### Data Model
- ✅ Tasks with work-product metadata
- ✅ Work types (part-of-element, delivery-enabler)
- ✅ Target outcomes
- ✅ Activities with status tracking
- ✅ Resources (time, energy, tools, materials)
- ✅ Position coordinates (Board view)

### 🔄 What Needs Enhancement

#### Board View (Critical for POPM)
- ⚠️ Current: Basic canvas with nodes
- 🎯 Needed: Full Work Wizard experience
- 🎯 Needed: Visual relationship connections
- 🎯 Needed: Auto-layout algorithm
- 🎯 Needed: Progressive disclosure (expand/collapse)

#### Work Creation Flow
- ⚠️ Current: Standard task form
- 🎯 Needed: 4-step Work Wizard
- 🎯 Needed: Side panel (canvas stays visible)
- 🎯 Needed: Activity generation as child nodes

#### Relationships & Flow
- ⚠️ Current: Basic relationship tracking
- 🎯 Needed: Visual drag-to-connect
- 🎯 Needed: Relationship types (feeds-into, generates, blocks)
- 🎯 Needed: Flow visualization

---

## Implementation Phases

### Phase 1: Enhanced Board View (Priority 1)

**Goal**: Transform Board view into true POPM canvas experience

**Timeline**: 2-3 weeks

#### 1.1 Work Wizard Implementation
**Location**: `frontend/src/components/WorkWizard.jsx` (new)

**Features**:
- Side panel that opens from Board view
- 4-step process:
  1. **Define**: Name, element, dates, work type
  2. **Activities**: Add sub-tasks with estimates
  3. **Resources**: Time, energy, tools, materials, people
  4. **Review**: Confirm and create

**Design**:
```jsx
<WorkWizard
  isOpen={wizardOpen}
  onClose={() => setWizardOpen(false)}
  onComplete={(workData) => createWork(workData)}
  workId={editingWork?.id} // For editing existing
  initialData={editingWork} // For editing
/>
```

**Technical**:
- Animated side panel (slide from right)
- Stepper component for 4 steps
- Form validation
- Auto-save to Blue.cc
- Creates parent task + activity children

---

#### 1.2 Enhanced Work Nodes
**Location**: `frontend/src/components/WorkNode.jsx` (update)

**Features**:
- Show dimension icon (Content, Practice, etc.)
- Progress bar (activities completed / total)
- Status indicator (color-coded)
- Expand/collapse functionality
- Quick actions menu (edit, delete, link)

**Design**:
```jsx
<WorkNode
  data={{
    title: "Chapter 12: The Body as Classroom",
    dimension: "content",
    element: "books",
    progress: 40, // 2/5 activities
    status: "in-progress",
    activities: [...]
  }}
  expanded={false}
  onExpand={() => toggleExpand(id)}
  onEdit={() => openWizard(id)}
/>
```

**Expanded State** shows:
- All activities with checkboxes
- Resource summary
- Target outcome
- Quick edit buttons

---

#### 1.3 Activity Child Nodes
**Location**: `frontend/src/components/ActivityNode.jsx` (new)

**Features**:
- Auto-positioned below parent Work
- Show title, time estimate, status
- Checkbox to mark complete
- Updates parent progress
- Connected with edges

**Layout**:
```
┌─────────────────────┐
│  Work: Chapter 12   │
│  Progress: 40%      │
└──────────┬──────────┘
           │
    ┌──────┴──────┬──────────┬─────────┐
    ↓             ↓          ↓         ↓
 [Outline] [Write Draft] [Edit] [Polish]
    ✓            [40%]       □        □
```

---

#### 1.4 Visual Relationship Connections
**Location**: Update Board view edge handling

**Features**:
- Drag from one Work node to another
- Modal opens: "What's the relationship?"
  - Feeds into →
  - Comes from ←
  - Related to ↔
  - Blocks ⊗
  - Generates ⚡
- Custom label (optional)
- Color-coded by type

**User Flow**:
1. Click "Link" button on Work node
2. Click target Work node
3. Choose relationship type
4. Edge appears with label

---

#### 1.5 Auto-Layout Algorithm
**Location**: `frontend/src/utils/autoLayout.js` (new)

**Features**:
- Dagre algorithm implementation
- One-click "Organize" button
- Smart spacing
- Hierarchical arrangement
- Preserves relationships

**Button**: "Auto-Organize Board" ✨

---

### Phase 2: Dimension Boards (Priority 2)

**Goal**: Separate canvas for each dimension

**Timeline**: 1-2 weeks

#### 2.1 Dimension Tabs
**Location**: `frontend/src/components/DimensionTabs.jsx` (new)

**Features**:
- 5 tabs at top of Board view:
  - 📘 Content
  - 🧘 Practice
  - 👥 Community
  - 📣 Marketing
  - 📋 Admin
- Each dimension has own canvas
- Works stored with dimension tag
- Switch between with hotkeys (1-5)

---

#### 2.2 Cross-Dimension Links
**Location**: Update relationship system

**Features**:
- Link Works across dimensions
- Visual indicator: "Links to Practice board"
- Click to jump to linked Work on other board
- Understand flow across dimensions

**Example**:
```
Content Board:
  "Chapter 12" ──[generated-by]──> "Stone Practice" (Practice board)

Practice Board:
  "Stone Practice" ──[generates]──> "Chapter 12" (Content board)
```

---

### Phase 3: Enhanced Context Visibility (Priority 3)

**Goal**: Context always visible, meaning preserved

**Timeline**: 1 week

#### 3.1 Work Context Panel
**Location**: `frontend/src/components/WorkContextPanel.jsx` (new)

**Features**:
When viewing/editing a Work, show:
```
📘 Content → Books → "Chapter 12: The Body as Classroom"

Status: Writing (In Progress)
Progress: 2/5 activities (40%)

Feeds into:
  → "Substack Article Series" (in 2-3 weeks)

Part of:
  → "Book 1: Genesis Unveiled"

Resources Needed:
  ⏱ 20h deep work
  ⚡ Focused work energy
  🛠 Google Docs, Personal notes
```

---

#### 3.2 Contextual Breadcrumbs
**Location**: Update all view headers

**Features**:
Always show: `Dimension → Element → Work → Activity`

**Example**:
```
📘 Content → Books → Chapter 12 → Write First Draft
```

Clicking any part navigates to that level.

---

### Phase 4: Bidirectional Sync Polish (Priority 4)

**Goal**: Seamless sync between Board ↔ List

**Timeline**: 1 week

#### 4.1 Real-Time Updates
**Location**: Update TasksContext

**Features**:
- Edit in Board → Updates List instantly
- Edit in List → Updates Board position/status
- No page refresh needed
- Optimistic UI updates

---

#### 4.2 List View Enhancements
**Location**: `frontend/src/pages/TasksPage.jsx`

**Features**:
- Show Works as containers (expandable)
- Activities nested inside
- Progress indicators
- Quick jump to Board position
- Filter by dimension

**Design**:
```
📦 Chapter 12: The Body as Classroom
   📘 Content → Books
   ⏰ Target: Feb 15
   ⚡ Progress: 40% (2/5)

   Activities:
   ✓ Outline structure (2h)
   🔄 Write first draft (8h) [40% complete]
   □ First edit (4h)
   □ Second edit (2h)
   □ Polish (1h)

   [View on Board] [Edit Work]
```

---

### Phase 5: Onboarding & Education (Priority 5)

**Goal**: Help users understand POPM paradigm

**Timeline**: 1 week

#### 5.1 First-Time User Experience
**Location**: `frontend/src/components/Onboarding.jsx` (new)

**Flow**:
1. **Welcome**: "Welcome to Process-Oriented PM"
2. **Paradigm Explanation**: Work-first, not task-first
3. **Canvas Introduction**: See the blank canvas
4. **First Work Creation**: Guided wizard experience
5. **Success**: Your first Work is on the canvas!

---

#### 5.2 In-App Tooltips
**Location**: Various components

**Features**:
- Contextual help throughout
- Explain POPM concepts
- Show keyboard shortcuts
- "?" icon for help anywhere

**Examples**:
- "What's a Work? → A meaningful work-product, not a task"
- "Why canvas? → Matches how process-oriented people think"
- "What's a dimension? → Domain of your work (Content, Practice, etc.)"

---

#### 5.3 Sample Template
**Location**: Backend + Frontend

**Features**:
- Pre-populated example board
- Sample book project with chapters
- Shows best practices
- Users can delete after learning

---

### Phase 6: Polish & Performance (Priority 6)

**Goal**: Production-quality experience

**Timeline**: 1 week

#### 6.1 UI/UX Polish
- Animations and transitions
- Loading states
- Error handling
- Empty states with guidance
- Keyboard shortcuts
- Dark mode (optional)

#### 6.2 Performance Optimization
- Canvas rendering optimization
- Lazy loading for large boards
- Debounced auto-save
- Efficient Blue.cc sync
- Bundle size optimization

#### 6.3 Accessibility
- Keyboard navigation
- Screen reader support
- ARIA labels
- Focus management
- Color contrast

---

## Technical Implementation Details

### New Components Needed

```
frontend/src/components/
├── WorkWizard.jsx           # 4-step Work creation wizard
├── WorkNode.jsx             # Enhanced Work node (update existing)
├── ActivityNode.jsx         # Activity child nodes
├── DimensionTabs.jsx        # Dimension switcher
├── WorkContextPanel.jsx     # Context display panel
├── RelationshipModal.jsx    # Choose relationship type
├── AutoLayoutButton.jsx     # Trigger auto-layout
└── Onboarding.jsx           # First-time user flow
```

### New Utils Needed

```
frontend/src/utils/
├── autoLayout.js           # Dagre algorithm wrapper
├── nodePositioning.js      # Calculate child positions
└── relationshipTypes.js    # Relationship type definitions
```

### State Management Updates

```javascript
// TasksContext additions
{
  // Existing
  tasks: [],

  // New
  currentDimension: 'content',
  expandedWorks: new Set(),
  relationships: [],
  autoLayoutEnabled: true
}
```

---

## Design System Alignment

### Work Node Styling (Glass Morphism)

```css
.work-node {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.work-node.expanded {
  /* Larger, shows activities */
}

.work-node.content {
  border-left: 4px solid #6366F1; /* Indigo */
}

.work-node.practice {
  border-left: 4px solid #10B981; /* Green */
}
```

### Dimension Colors

```javascript
const DIMENSION_COLORS = {
  content: '#6366F1',    // Indigo
  practice: '#10B981',   // Green
  community: '#EC4899',  // Pink
  marketing: '#F59E0B',  // Amber
  admin: '#8B5CF6'       // Purple
};
```

---

## Success Metrics

### User Engagement
- Time spent in Board view vs List view
- Number of Works created per user
- Relationship connections made
- Dimension usage distribution

### User Satisfaction
- Task completion rate
- Return rate (daily active users)
- Feature usage analytics
- User feedback scores

### Business Metrics
- User retention (30-day, 90-day)
- Conversion free → paid
- Referral rate
- NPS score

---

## Rollout Strategy

### Week 1-2: Work Wizard + Enhanced Nodes
Foundation for POPM experience

### Week 3-4: Relationships + Auto-Layout
Enable flow visualization

### Week 5: Dimension Boards
Separate domains, reduce overwhelm

### Week 6: Context Visibility
Ensure meaning preserved

### Week 7: Sync Polish
Seamless Board ↔ List

### Week 8: Onboarding + Education
Help users understand paradigm

### Week 9: Polish & Testing
Production quality

### Week 10: Beta Launch
Inner Allies community

---

## Risk Mitigation

### Technical Risks

**Risk**: Canvas performance with many nodes
**Mitigation**: Lazy loading, virtualization, optimize renders

**Risk**: Blue.cc sync reliability
**Mitigation**: Local-first architecture, retry logic, user feedback

**Risk**: Complex state management
**Mitigation**: Comprehensive testing, gradual rollout

### User Adoption Risks

**Risk**: Paradigm shift too different
**Mitigation**: Excellent onboarding, education, support

**Risk**: Users revert to old tools
**Mitigation**: Quick wins, testimonials, community support

**Risk**: Technical barriers (bugs)
**Mitigation**: Thorough testing, rapid bug fixes, user feedback loops

---

## Future Enhancements (Post-MVP)

### v2.0 Features
- Real-time collaboration
- Templates and presets
- CSV import/export with POPM structure
- Mobile app
- AI-powered suggestions

### v3.0 Vision
- Multi-user workspaces
- Publishing/sharing boards publicly
- Integrations (Notion, Google Docs, etc.)
- Advanced analytics
- Custom dimensions

---

## Conclusion

We have a **solid foundation** with the current v1.0 implementation. The core infrastructure (backend, cloud sync, data model, unified state) is production-ready.

**Next Steps**: Focus on transforming the Board view into the full POPM experience as outlined in the manifesto. This is where the magic happens—where process-oriented thinkers finally have a tool that matches how they think.

**Timeline**: 8-10 weeks to complete MVP with all core POPM features

**Status**: Ready to begin Phase 1 implementation

---

**Let's build infrastructure for a different way of working.** 🌟
