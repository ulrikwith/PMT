# Work-Centric Workflow Board
## Visual Planning System for Organic Work Flow

---

## Overview

The Workflow Board is a **mind map-based visual planning tool** that lets you assemble your work organically by connecting Works (work-products) across Dimensions and Elements. Unlike traditional task-based PM tools, this system recognizes that meaningful work happens through **Works** - the contextual containers that give individual activities their purpose.

**Core Philosophy:**
> "I don't think in tasks and deadlines. I think in Works - the meaningful chunks that create value. A book chapter only makes sense when I know it's part of a book that connects to Substack articles that serve my Content dimension."

---

## System Architecture

```
DIMENSION (Content, Practices, Marketing, Community, Admin)
    ↓
ELEMENT (Books, Substack, Stone, Walk, Website, BOPA, etc.)
    ↓
WORK ← THE CENTRAL UNIT (Chapter 12, Substack Series, BOPA Campaign, etc.)
    ↓
ACTIVITIES (Outline, Write, Edit, Design, Research, etc.)
    ↓
RESOURCES (Time, Tools, Materials, People, Energy)
```

---

## The Mind Map Interface

### Visual Layout

The Workflow Board displays as an **interactive mind map** with:

**Center Node:** Selected Dimension
**First Ring:** Elements within that Dimension
**Second Ring:** Works within each Element
**Connections:** Visual arrows showing relationships between Works

```
                    Stone Initiative
                   /                \
                  /                  \
        Content ---- Books ---- Ch 12 Draft
              \          \
               \          Genesis Unveiled
                \                |
                 \               |
                  \         Ch 1-10 Complete
                   \             |
                    \            |
                  Substack ---- Article Series
                                      |
                                      |
                              [Arrow pointing from Ch 12 to Article]
                              "Feeds into articles 2-3 weeks"
```

### Interaction Model

**Click Dimension → Expands Elements**
**Click Element → Expands Works**
**Click Work → Opens Work Detail Panel**
**Drag to Connect → Creates relationship arrow**
**Double-click empty space → Quick Create Work**

---

## Work Wizard System

### Two Creation Paths

#### 1. Quick Add (Context Menu)
Right-click anywhere on the board:
```
┌─────────────────────┐
│  + Quick Add Work   │
├─────────────────────┤
│  Name: [_________ ] │
│  Element: [Books ▼] │
│  [Create]           │
└─────────────────────┘
```
Minimal fields, opens Work for editing after creation

#### 2. Full Wizard (Primary Creation)
Click "Create Work" button or press `Cmd+W`

---

## Full Work Wizard Flow

### Step 1: Placement (Where does this belong?)

```jsx
<div className="glass-panel rounded-2xl p-8 max-w-2xl mx-auto">
  <div className="flex items-center gap-4 mb-8">
    {/* Step Indicators */}
    <div className="flex-1 flex items-center gap-2">
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 text-white font-semibold">
        1
      </div>
      <div className="text-sm font-medium text-white">Placement</div>
      <div className="flex-1 h-px bg-white/10"></div>
      
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-800 text-slate-500 font-semibold">
        2
      </div>
      <div className="text-sm font-medium text-slate-500">Define</div>
      <div className="flex-1 h-px bg-white/10"></div>
      
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-800 text-slate-500 font-semibold">
        3
      </div>
      <div className="text-sm font-medium text-slate-500">Activities</div>
      <div className="flex-1 h-px bg-white/10"></div>
      
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-800 text-slate-500 font-semibold">
        4
      </div>
      <div className="text-sm font-medium text-slate-500">Resources</div>
      <div className="flex-1 h-px bg-white/10"></div>
      
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-800 text-slate-500 font-semibold">
        5
      </div>
      <div className="text-sm font-medium text-slate-500">Connect</div>
    </div>
  </div>

  {/* Step Content */}
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-white mb-4">Where does this Work belong?</h2>
    
    {/* Dimension Selection */}
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-3">
        Dimension
      </label>
      <div className="grid grid-cols-5 gap-3">
        <button className="glass-panel p-4 rounded-lg hover:border-blue-500/50 transition-all flex flex-col items-center gap-2 border-2 border-blue-500">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-sm font-medium text-blue-500">Content</span>
        </button>
        
        <button className="glass-panel p-4 rounded-lg hover:border-emerald-500/50 transition-all flex flex-col items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          <span className="text-sm font-medium text-slate-400">Practices</span>
        </button>
        
        <button className="glass-panel p-4 rounded-lg hover:border-amber-500/50 transition-all flex flex-col items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <span className="text-sm font-medium text-slate-400">Marketing</span>
        </button>
        
        <button className="glass-panel p-4 rounded-lg hover:border-pink-500/50 transition-all flex flex-col items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-pink-500"></div>
          <span className="text-sm font-medium text-slate-400">Community</span>
        </button>
        
        <button className="glass-panel p-4 rounded-lg hover:border-purple-500/50 transition-all flex flex-col items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
          <span className="text-sm font-medium text-slate-400">Admin</span>
        </button>
      </div>
    </div>
    
    {/* Element Selection */}
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-3">
        Element (What is this part of?)
      </label>
      <div className="grid grid-cols-3 gap-3">
        <button className="glass-panel p-3 rounded-lg border-2 border-blue-500 hover:bg-slate-800/60 transition-all text-left">
          <div className="text-sm font-medium text-white">Books</div>
          <div className="text-xs text-slate-500 mt-1">3 active works</div>
        </button>
        
        <button className="glass-panel p-3 rounded-lg hover:border-blue-500/50 hover:bg-slate-800/60 transition-all text-left">
          <div className="text-sm font-medium text-slate-300">Substack</div>
          <div className="text-xs text-slate-500 mt-1">5 active works</div>
        </button>
        
        <button className="glass-panel p-3 rounded-lg hover:border-blue-500/50 hover:bg-slate-800/60 transition-all text-left">
          <div className="text-sm font-medium text-slate-300">Newsletter</div>
          <div className="text-xs text-slate-500 mt-1">1 active work</div>
        </button>
        
        <button className="glass-panel p-3 rounded-lg hover:border-blue-500/50 hover:bg-slate-800/60 transition-all text-left">
          <div className="text-sm font-medium text-slate-300">Stone</div>
          <div className="text-xs text-slate-500 mt-1">2 active works</div>
        </button>
        
        <button className="glass-panel p-3 rounded-lg hover:border-blue-500/50 hover:bg-slate-800/60 transition-all text-left">
          <div className="text-sm font-medium text-slate-300">Walk</div>
          <div className="text-xs text-slate-500 mt-1">0 active works</div>
        </button>
      </div>
    </div>
  </div>
  
  {/* Navigation */}
  <div className="flex justify-between mt-8 pt-6 border-t border-white/5">
    <button className="px-6 py-2.5 text-slate-400 font-medium rounded-lg hover:text-white hover:bg-slate-800/40 transition-all">
      Cancel
    </button>
    <button className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all">
      Next: Define Work →
    </button>
  </div>
</div>
```

**Outcome:** Dimension (Content) + Element (Books) selected

---

### Step 2: Define (What is this Work?)

```jsx
<div className="glass-panel rounded-2xl p-8 max-w-2xl mx-auto">
  {/* Step indicators at top */}
  
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-white mb-4">Define this Work</h2>
    
    {/* Work Name */}
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        Work Name
      </label>
      <input
        type="text"
        className="w-full px-4 py-3 bg-slate-900/60 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
        placeholder="e.g., Chapter 12: The Body as Classroom"
        autoFocus
      />
      <p className="text-xs text-slate-500 mt-2">Give this Work a meaningful name that captures its essence</p>
    </div>
    
    {/* Description */}
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        Description (Optional)
      </label>
      <textarea
        className="w-full px-4 py-3 bg-slate-900/60 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all resize-none"
        rows={3}
        placeholder="What is this Work about? What value does it create?"
      />
    </div>
    
    {/* Work Type */}
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-3">
        Work Type
      </label>
      <div className="grid grid-cols-2 gap-3">
        <button className="glass-panel p-4 rounded-lg border-2 border-blue-500 hover:bg-slate-800/60 transition-all text-left">
          <div className="flex items-center gap-3 mb-2">
            <Book className="text-blue-500" size={20} />
            <span className="text-sm font-semibold text-white">Complete Element</span>
          </div>
          <p className="text-xs text-slate-400">This Work IS the Element (e.g., a complete book)</p>
        </button>
        
        <button className="glass-panel p-4 rounded-lg hover:border-blue-500/50 hover:bg-slate-800/60 transition-all text-left">
          <div className="flex items-center gap-3 mb-2">
            <Component className="text-slate-400" size={20} />
            <span className="text-sm font-semibold text-slate-300">Part of Element</span>
          </div>
          <p className="text-xs text-slate-500">This Work is ONE PART of the Element (e.g., a chapter)</p>
        </button>
      </div>
    </div>
    
    {/* Target Outcome */}
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        What's the outcome when this Work is complete?
      </label>
      <input
        type="text"
        className="w-full px-4 py-3 bg-slate-900/60 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
        placeholder="e.g., Final draft ready for Book 1"
      />
    </div>
    
    {/* Timeline */}
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Start Date (Optional)
        </label>
        <input
          type="date"
          className="w-full px-4 py-3 bg-slate-900/60 border border-white/10 rounded-lg text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Target Completion
        </label>
        <input
          type="date"
          className="w-full px-4 py-3 bg-slate-900/60 border border-white/10 rounded-lg text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
        />
      </div>
    </div>
  </div>
  
  {/* Navigation */}
  <div className="flex justify-between mt-8 pt-6 border-t border-white/5">
    <button className="px-6 py-2.5 text-slate-400 font-medium rounded-lg hover:text-white hover:bg-slate-800/40 transition-all">
      ← Back
    </button>
    <button className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all">
      Next: Activities →
    </button>
  </div>
</div>
```

**Outcome:** Work named, described, typed, and timeline set

---

### Step 3: Activities (What needs to happen?)

```jsx
<div className="glass-panel rounded-2xl p-8 max-w-2xl mx-auto">
  {/* Step indicators at top */}
  
  <div className="space-y-6">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Define Activities</h2>
        <p className="text-sm text-slate-400 mt-1">What tasks are needed to complete this Work?</p>
      </div>
      <button className="px-4 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-500 rounded-lg hover:bg-blue-500/30 transition-all flex items-center gap-2">
        <Sparkles size={16} />
        Suggest Activities
      </button>
    </div>
    
    {/* Activity List */}
    <div className="space-y-3">
      {/* Activity 1 - Existing */}
      <div className="glass-panel rounded-lg p-4 border border-emerald-500/20">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-semibold text-sm flex-shrink-0 mt-0.5">
            1
          </div>
          <div className="flex-1">
            <input
              type="text"
              className="w-full bg-transparent border-none text-white font-medium focus:outline-none mb-2"
              value="Outline / Structure"
              readOnly
            />
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                2 hours
              </span>
              <span>•</span>
              <span>Deep work</span>
            </div>
          </div>
          <button className="p-1 rounded text-slate-500 hover:text-red-500 transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      {/* Activity 2 - Existing */}
      <div className="glass-panel rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-700/30 border border-slate-700/30 text-slate-400 font-semibold text-sm flex-shrink-0 mt-0.5">
            2
          </div>
          <div className="flex-1">
            <input
              type="text"
              className="w-full bg-transparent border-none text-white font-medium focus:outline-none mb-2"
              value="Write first draft (2500-3000 words)"
              readOnly
            />
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                6-8 hours
              </span>
              <span>•</span>
              <span>Deep work</span>
            </div>
          </div>
          <button className="p-1 rounded text-slate-500 hover:text-red-500 transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      {/* Activity 3 - Existing */}
      <div className="glass-panel rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-700/30 border border-slate-700/30 text-slate-400 font-semibold text-sm flex-shrink-0 mt-0.5">
            3
          </div>
          <div className="flex-1">
            <input
              type="text"
              className="w-full bg-transparent border-none text-white font-medium focus:outline-none mb-2"
              value="First edit"
              readOnly
            />
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                3-4 hours
              </span>
            </div>
          </div>
          <button className="p-1 rounded text-slate-500 hover:text-red-500 transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      {/* Add New Activity */}
      <button className="w-full glass-panel rounded-lg p-4 border-2 border-dashed border-slate-700 hover:border-blue-500/50 text-slate-500 hover:text-blue-500 transition-all flex items-center justify-center gap-2">
        <Plus size={18} />
        <span className="font-medium">Add Activity</span>
      </button>
    </div>
    
    {/* Quick Templates */}
    <div className="pt-4 border-t border-white/5">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">Quick Templates</p>
      <div className="flex flex-wrap gap-2">
        <button className="px-3 py-1.5 bg-slate-800/40 border border-slate-700 rounded-lg text-xs text-slate-400 hover:text-blue-500 hover:border-blue-500/50 transition-all">
          + Writing Flow (5 activities)
        </button>
        <button className="px-3 py-1.5 bg-slate-800/40 border border-slate-700 rounded-lg text-xs text-slate-400 hover:text-blue-500 hover:border-blue-500/50 transition-all">
          + Research & Write (4 activities)
        </button>
        <button className="px-3 py-1.5 bg-slate-800/40 border border-slate-700 rounded-lg text-xs text-slate-400 hover:text-blue-500 hover:border-blue-500/50 transition-all">
          + Design & Production (6 activities)
        </button>
      </div>
    </div>
  </div>
  
  {/* Navigation */}
  <div className="flex justify-between mt-8 pt-6 border-t border-white/5">
    <button className="px-6 py-2.5 text-slate-400 font-medium rounded-lg hover:text-white hover:bg-slate-800/40 transition-all">
      ← Back
    </button>
    <button className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all">
      Next: Resources →
    </button>
  </div>
</div>
```

**Outcome:** Activities list created (can be edited later via existing task wizard)

---

### Step 4: Resources (What do you need?)

```jsx
<div className="glass-panel rounded-2xl p-8 max-w-2xl mx-auto">
  {/* Step indicators at top */}
  
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-white mb-4">What resources does this Work need?</h2>
    
    {/* Time Resources */}
    <div className="glass-panel rounded-xl p-5 border border-blue-500/20">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
          <Clock className="text-blue-500" size={20} />
        </div>
        <h3 className="text-lg font-semibold text-white">Time</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Estimated Hours
          </label>
          <input
            type="number"
            className="w-full px-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-lg text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
            placeholder="20"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Energy Level
          </label>
          <select className="w-full px-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-lg text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all">
            <option>Deep work</option>
            <option>Focused work</option>
            <option>Light work</option>
            <option>Admin</option>
          </select>
        </div>
      </div>
    </div>
    
    {/* Tools & Software */}
    <div className="glass-panel rounded-xl p-5 border border-purple-500/20">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
          <Wrench className="text-purple-500" size={20} />
        </div>
        <h3 className="text-lg font-semibold text-white">Tools & Software</h3>
      </div>
      
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-xs font-medium text-purple-500 flex items-center gap-2">
            Notion
            <X size={12} className="cursor-pointer hover:text-purple-300" />
          </span>
          <span className="px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full text-xs font-medium text-purple-500 flex items-center gap-2">
            Google Docs
            <X size={12} className="cursor-pointer hover:text-purple-300" />
          </span>
        </div>
        
        <input
          type="text"
          className="w-full px-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all"
          placeholder="Add tool or software..."
        />
      </div>
    </div>
    
    {/* Research Materials */}
    <div className="glass-panel rounded-xl p-5 border border-emerald-500/20">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
          <BookOpen className="text-emerald-500" size={20} />
        </div>
        <h3 className="text-lg font-semibold text-white">Research Materials</h3>
      </div>
      
      <textarea
        className="w-full px-4 py-3 bg-slate-900/60 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-all resize-none"
        rows={3}
        placeholder="What sources, books, notes, or materials do you need?"
      />
    </div>
    
    {/* People & Collaborators */}
    <div className="glass-panel rounded-xl p-5 border border-amber-500/20">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <Users className="text-amber-500" size={20} />
        </div>
        <h3 className="text-lg font-semibold text-white">People & Collaborators</h3>
      </div>
      
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <span className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-medium text-amber-500 flex items-center gap-2">
            Editor (Sarah)
            <X size={12} className="cursor-pointer hover:text-amber-300" />
          </span>
        </div>
        
        <input
          type="text"
          className="w-full px-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 focus:outline-none transition-all"
          placeholder="Add person or role..."
        />
      </div>
    </div>
    
    {/* Notes */}
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        Additional Notes
      </label>
      <textarea
        className="w-full px-4 py-3 bg-slate-900/60 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all resize-none"
        rows={3}
        placeholder="Any other resources or notes about what's needed?"
      />
    </div>
  </div>
  
  {/* Navigation */}
  <div className="flex justify-between mt-8 pt-6 border-t border-white/5">
    <button className="px-6 py-2.5 text-slate-400 font-medium rounded-lg hover:text-white hover:bg-slate-800/40 transition-all">
      ← Back
    </button>
    <button className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all">
      Next: Connect →
    </button>
  </div>
</div>
```

**Outcome:** Resources defined (time, tools, materials, people)

---

### Step 5: Connect (How does this relate to other Works?)

```jsx
<div className="glass-panel rounded-2xl p-8 max-w-2xl mx-auto">
  {/* Step indicators at top */}
  
  <div className="space-y-6">
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-white">Connect to other Works</h2>
      <p className="text-sm text-slate-400 mt-1">How does this Work relate to your other work?</p>
    </div>
    
    {/* Relationship Type Selector */}
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-3">
        Relationship Type
      </label>
      <div className="grid grid-cols-4 gap-3">
        <button className="glass-panel p-3 rounded-lg border-2 border-blue-500 hover:bg-slate-800/60 transition-all flex flex-col items-center gap-2">
          <ArrowRight className="text-blue-500" size={20} />
          <span className="text-xs font-medium text-blue-500">Feeds Into</span>
        </button>
        
        <button className="glass-panel p-3 rounded-lg hover:border-blue-500/50 hover:bg-slate-800/60 transition-all flex flex-col items-center gap-2">
          <ArrowLeft className="text-slate-400" size={20} />
          <span className="text-xs font-medium text-slate-400">Comes From</span>
        </button>
        
        <button className="glass-panel p-3 rounded-lg hover:border-blue-500/50 hover:bg-slate-800/60 transition-all flex flex-col items-center gap-2">
          <ArrowLeftRight className="text-slate-400" size={20} />
          <span className="text-xs font-medium text-slate-400">Related To</span>
        </button>
        
        <button className="glass-panel p-3 rounded-lg hover:border-blue-500/50 hover:bg-slate-800/60 transition-all flex flex-col items-center gap-2">
          <Lock className="text-slate-400" size={20} />
          <span className="text-xs font-medium text-slate-400">Blocks</span>
        </button>
      </div>
    </div>
    
    {/* Search Works */}
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-3">
        Find Work to Connect
      </label>
      <input
        type="text"
        className="w-full px-4 py-3 bg-slate-900/60 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
        placeholder="Search for Works..."
      />
    </div>
    
    {/* Suggested Connections */}
    <div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
        Suggested Connections
      </p>
      <div className="space-y-2">
        <button className="w-full glass-panel rounded-lg p-4 hover:border-blue-500/50 transition-all text-left">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-sm font-medium text-white">Substack Article Series</span>
              </div>
              <p className="text-xs text-slate-500">Content → Substack → 5 articles</p>
            </div>
            <Plus className="text-blue-500" size={18} />
          </div>
        </button>
        
        <button className="w-full glass-panel rounded-lg p-4 hover:border-blue-500/50 transition-all text-left">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-sm font-medium text-white">Book 1: Genesis Unveiled</span>
              </div>
              <p className="text-xs text-slate-500">Content → Books → Complete work</p>
            </div>
            <Plus className="text-blue-500" size={18} />
          </div>
        </button>
      </div>
    </div>
    
    {/* Current Connections */}
    <div className="pt-4 border-t border-white/5">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
        Current Connections
      </p>
      <div className="space-y-3">
        <div className="glass-panel rounded-lg p-4 border border-blue-500/20">
          <div className="flex items-start gap-3">
            <ArrowRight className="text-blue-500 flex-shrink-0 mt-0.5" size={18} />
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">Substack Article Series</span>
                <button className="p-1 rounded text-slate-500 hover:text-red-500 transition-colors">
                  <X size={14} />
                </button>
              </div>
              <p className="text-xs text-slate-400">This chapter feeds into articles in 2-3 weeks</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  {/* Navigation */}
  <div className="flex justify-between mt-8 pt-6 border-t border-white/5">
    <button className="px-6 py-2.5 text-slate-400 font-medium rounded-lg hover:text-white hover:bg-slate-800/40 transition-all">
      ← Back
    </button>
    <button className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-lg shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all">
      Create Work ✓
    </button>
  </div>
</div>
```

**Outcome:** Relationships to other Works defined with directional arrows

---

## Mind Map Visualization

### Main Board Layout

```jsx
<div className="h-screen flex flex-col bg-slate-950">
  {/* Top Toolbar */}
  <div className="glass-panel border-b border-white/5 px-6 py-3 flex items-center justify-between">
    <div className="flex items-center gap-4">
      <h1 className="text-lg font-bold text-white">Workflow Board</h1>
      <div className="flex items-center gap-2">
        <button className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs font-medium text-blue-500">
          Content
        </button>
        <ChevronRight size={14} className="text-slate-600" />
        <button className="px-3 py-1.5 bg-slate-800/60 border border-white/10 rounded-lg text-xs font-medium text-slate-400">
          All Dimensions
        </button>
      </div>
    </div>
    
    <div className="flex items-center gap-3">
      {/* View Controls */}
      <div className="flex items-center gap-1 p-1 bg-slate-900/60 rounded-lg">
        <button className="px-3 py-1.5 bg-blue-500 text-white rounded text-xs font-medium">
          Mind Map
        </button>
        <button className="px-3 py-1.5 text-slate-400 hover:text-white rounded text-xs font-medium">
          Timeline
        </button>
        <button className="px-3 py-1.5 text-slate-400 hover:text-white rounded text-xs font-medium">
          Gantt
        </button>
      </div>
      
      {/* Zoom Controls */}
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg bg-slate-800/60 text-slate-400 hover:text-white transition-all">
          <ZoomOut size={16} />
        </button>
        <span className="text-xs text-slate-500 font-medium">100%</span>
        <button className="p-2 rounded-lg bg-slate-800/60 text-slate-400 hover:text-white transition-all">
          <ZoomIn size={16} />
        </button>
      </div>
      
      {/* Create Work Button */}
      <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all flex items-center gap-2">
        <Plus size={18} />
        Create Work
      </button>
    </div>
  </div>
  
  {/* Mind Map Canvas */}
  <div className="flex-1 relative overflow-hidden">
    {/* SVG Canvas for connections */}
    <svg className="absolute inset-0 w-full h-full pointer-events-none">
      {/* Arrow connections between Works */}
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#3B82F6" />
        </marker>
      </defs>
      
      {/* Example connection: Ch 12 → Substack */}
      <path
        d="M 300 400 Q 450 350, 600 300"
        stroke="#3B82F6"
        strokeWidth="2"
        fill="none"
        markerEnd="url(#arrowhead)"
        opacity="0.6"
      />
      
      {/* Connection label */}
      <text x="450" y="340" fill="#3B82F6" fontSize="11" fontWeight="500">
        feeds into
      </text>
    </svg>
    
    {/* Draggable nodes container */}
    <div className="absolute inset-0 p-12">
      {/* Center Node - Dimension */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 shadow-2xl shadow-blue-500/40 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
          <span className="text-white font-bold text-lg">Content</span>
        </div>
      </div>
      
      {/* First Ring - Elements */}
      <div className="absolute top-1/2 left-1/4 transform -translate-x-1/2 -translate-y-1/2">
        <div className="glass-panel rounded-xl p-4 w-48 border border-blue-500/30 cursor-pointer hover:border-blue-500/60 transition-all hover:scale-105">
          <div className="flex items-center gap-3 mb-2">
            <Book className="text-blue-500" size={20} />
            <h3 className="font-semibold text-white">Books</h3>
          </div>
          <p className="text-xs text-slate-500">3 active works</p>
        </div>
      </div>
      
      <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="glass-panel rounded-xl p-4 w-48 border border-blue-500/30 cursor-pointer hover:border-blue-500/60 transition-all hover:scale-105">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="text-blue-500" size={20} />
            <h3 className="font-semibold text-white">Substack</h3>
          </div>
          <p className="text-xs text-slate-500">5 active works</p>
        </div>
      </div>
      
      {/* Second Ring - Works */}
      <div className="absolute top-1/3 left-1/6 transform -translate-x-1/2 -translate-y-1/2">
        <div className="glass-panel rounded-lg p-3 w-56 border border-white/10 cursor-pointer hover:border-emerald-500/50 transition-all group">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <Check size={14} className="text-emerald-500" />
            </div>
            <h4 className="text-sm font-semibold text-white">Ch 12: Body as Classroom</h4>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Activity size={12} className="text-orange-500" />
            <span>5 activities</span>
            <span>•</span>
            <span>20h</span>
          </div>
          
          {/* Quick actions on hover */}
          <div className="mt-2 pt-2 border-t border-white/5 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="flex-1 px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded text-xs text-blue-500 hover:bg-blue-500/30 transition-all">
              View
            </button>
            <button className="px-2 py-1 bg-slate-800/60 border border-white/10 rounded text-xs text-slate-400 hover:text-white transition-all">
              <Link2 size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
    
    {/* Mini Map (bottom-right corner) */}
    <div className="absolute bottom-6 right-6 w-48 h-32 glass-panel rounded-lg border border-white/5 p-2">
      <div className="w-full h-full bg-slate-900/40 rounded relative">
        {/* Simplified view of entire map */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-blue-500"></div>
        <div className="absolute top-1/3 left-1/4 w-2 h-2 rounded bg-blue-400"></div>
        <div className="absolute top-2/3 left-2/3 w-2 h-2 rounded bg-emerald-400"></div>
        
        {/* Viewport indicator */}
        <div className="absolute inset-0 border-2 border-blue-500/50 rounded" style={{ width: '60%', height: '60%', top: '20%', left: '20%' }}></div>
      </div>
    </div>
  </div>
</div>
```

---

## Work Detail Panel

When clicking on a Work node in the mind map, a detail panel slides in from the right:

```jsx
<div className="absolute top-0 right-0 w-96 h-full glass-panel border-l border-white/5 shadow-2xl transform translate-x-0 transition-transform duration-300">
  {/* Header */}
  <div className="p-6 border-b border-white/5">
    <div className="flex items-start justify-between mb-4">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          <span className="text-xs text-slate-500">Content → Books</span>
        </div>
        <h2 className="text-xl font-bold text-white">
          Chapter 12: The Body as Classroom
        </h2>
      </div>
      <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all">
        <X size={20} />
      </button>
    </div>
    
    {/* Status Badge */}
    <div className="status-writing inline-flex items-center gap-2 px-3 py-1.5 rounded-full">
      <Activity size={12} className="animate-pulse" />
      <span className="text-xs font-semibold uppercase tracking-wider">In Progress</span>
    </div>
  </div>
  
  {/* Content - Scrollable */}
  <div className="flex-1 overflow-y-auto p-6 space-y-6">
    {/* Description */}
    <div>
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
        Description
      </h3>
      <p className="text-sm text-slate-300 leading-relaxed">
        Expand on shower experience from personal story. Connect physical sensing to awareness discovery.
      </p>
    </div>
    
    {/* Progress */}
    <div>
      <div className="flex justify-between text-xs text-slate-400 mb-2">
        <span>Activities Complete</span>
        <span>2 / 5 (40%)</span>
      </div>
      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: '40%' }}></div>
      </div>
    </div>
    
    {/* Activities */}
    <div>
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Activities
      </h3>
      <div className="space-y-2">
        <div className="glass-panel rounded-lg p-3 border border-emerald-500/20">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
              <Check size={12} className="text-emerald-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-white font-medium">Outline / Structure</p>
              <p className="text-xs text-slate-500">2h • Deep work</p>
            </div>
          </div>
        </div>
        
        <div className="glass-panel rounded-lg p-3 border border-blue-500/20 bg-blue-500/5">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
              <Activity size={12} className="text-blue-500 animate-pulse" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-white font-medium">Write first draft</p>
              <p className="text-xs text-slate-500">6-8h • Deep work</p>
            </div>
          </div>
        </div>
        
        <div className="glass-panel rounded-lg p-3">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded bg-slate-700/30 border border-slate-700/30 flex items-center justify-center flex-shrink-0">
              <span className="text-xs text-slate-500">3</span>
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-300 font-medium">First edit</p>
              <p className="text-xs text-slate-500">3-4h</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    {/* Resources */}
    <div>
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Resources Needed
      </h3>
      
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Clock className="text-blue-500" size={16} />
          <div className="flex-1">
            <p className="text-sm text-white">20 hours estimated</p>
            <p className="text-xs text-slate-500">Deep work required</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <Wrench className="text-purple-500 flex-shrink-0 mt-0.5" size={16} />
          <div className="flex-1">
            <p className="text-sm text-white mb-2">Tools</p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded text-xs text-purple-500">
                Notion
              </span>
              <span className="px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded text-xs text-purple-500">
                Google Docs
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    {/* Connections */}
    <div>
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
        Connected Works
      </h3>
      
      <div className="space-y-2">
        <div className="glass-panel rounded-lg p-3 border border-blue-500/20">
          <div className="flex items-center gap-3">
            <ArrowRight className="text-blue-500 flex-shrink-0" size={16} />
            <div className="flex-1">
              <p className="text-sm text-white font-medium">Substack Article Series</p>
              <p className="text-xs text-slate-500">Feeds into in 2-3 weeks</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  {/* Actions Footer */}
  <div className="p-6 border-t border-white/5 space-y-3">
    <button className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all">
      Continue Work
    </button>
    
    <div className="grid grid-cols-2 gap-3">
      <button className="px-4 py-2 bg-slate-800/60 border border-white/10 text-slate-300 font-medium rounded-lg hover:border-blue-500/50 transition-all">
        Edit
      </button>
      <button className="px-4 py-2 bg-slate-800/60 border border-white/10 text-slate-300 font-medium rounded-lg hover:border-emerald-500/50 transition-all">
        Complete
      </button>
    </div>
  </div>
</div>
```

---

## Connection Arrow System

### Creating Connections

**Method 1: Drag & Drop**
1. Hover over a Work node
2. Connection handle appears (small circle on edge)
3. Click and drag to another Work
4. Choose arrow direction in popup
5. Connection created

**Method 2: Detail Panel**
1. Open Work detail panel
2. Click "Add Connection" in Connections section
3. Search for target Work
4. Choose relationship type
5. Connection created

### Arrow Types

```jsx
// Arrow Direction Options
const ARROW_TYPES = {
  RIGHT: {
    icon: ArrowRight,
    label: 'Feeds Into →',
    color: '#3B82F6',
    description: 'This Work feeds into the connected Work'
  },
  LEFT: {
    icon: ArrowLeft,
    label: '← Comes From',
    color: '#10B981',
    description: 'This Work comes from the connected Work'
  },
  BOTH: {
    icon: ArrowLeftRight,
    label: '↔ Related To',
    color: '#8B5CF6',
    description: 'Bidirectional relationship'
  },
  LINE: {
    icon: Minus,
    label: '─ Connected',
    color: '#94A3B8',
    description: 'Non-directional connection'
  },
  BLOCKS: {
    icon: Lock,
    label: '⊗ Blocks',
    color: '#F59E0B',
    description: 'This Work blocks the other'
  }
};
```

### Visual Rendering

```javascript
// SVG path with custom styling based on arrow type
function renderConnection(from, to, type) {
  const path = calculateCurvedPath(from.x, from.y, to.x, to.y);
  
  return (
    <g>
      <path
        d={path}
        stroke={type.color}
        strokeWidth={2}
        fill="none"
        markerEnd={type !== 'LINE' ? 'url(#arrowhead)' : undefined}
        opacity={0.6}
        className="hover:opacity-100 cursor-pointer"
      />
      
      {/* Connection label */}
      <text
        x={midpointX}
        y={midpointY}
        fill={type.color}
        fontSize={11}
        fontWeight={500}
        className="pointer-events-none"
      >
        {type.label}
      </text>
    </g>
  );
}
```

---

## Alternative Views

### Timeline View

Shows Works arranged chronologically with start/end dates:

```
Jan 2026          Feb 2026          Mar 2026
    |                 |                 |
    [Ch 12 Draft]─────┐
                      │
                      └──>[Substack Series]
                                │
                                └──>[Newsletter]
```

### Gantt View

Traditional Gantt chart for those who want linear planning:
- Rows: Works
- Columns: Time periods
- Bars: Duration
- Dependencies: Arrows

---

## Keyboard Shortcuts

```
Cmd/Ctrl + W     → Create new Work
Cmd/Ctrl + K     → Search Works
Space + Drag     → Pan canvas
Cmd/Ctrl + Scroll → Zoom in/out
Delete           → Delete selected Work/Connection
E                → Edit selected Work
C                → Add connection from selected Work
Esc              → Close panels/deselect
```

---

## Mobile Considerations

On mobile/tablet:
- Mind map becomes scrollable list view
- Tap Work to open detail panel
- Connections shown as list under each Work
- Create Work opens full-screen wizard

---

## Data Structure

### Work Object
```typescript
interface Work {
  id: string;
  name: string;
  description?: string;
  
  // Placement
  dimensionId: string;  // 'content', 'practices', etc.
  elementId: string;    // 'books', 'substack', etc.
  
  // Type
  workType: 'complete-element' | 'part-of-element';
  
  // Outcome
  targetOutcome: string;
  
  // Timeline
  startDate?: Date;
  targetCompletion?: Date;
  
  // Activities
  activities: Activity[];
  
  // Resources
  resources: {
    timeEstimate?: number;  // hours
    energyLevel?: 'deep' | 'focused' | 'light' | 'admin';
    tools?: string[];
    materials?: string;
    people?: string[];
    notes?: string;
  };
  
  // Connections
  connections: Connection[];
  
  // Position (for mind map)
  position: {
    x: number;
    y: number;
  };
  
  // Status
  status: 'planning' | 'in-progress' | 'review' | 'complete' | 'paused';
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

interface Activity {
  id: string;
  title: string;
  description?: string;
  timeEstimate?: number;
  energyLevel?: string;
  status: 'todo' | 'in-progress' | 'done';
  order: number;
}

interface Connection {
  id: string;
  fromWorkId: string;
  toWorkId: string;
  type: 'feeds-into' | 'comes-from' | 'related-to' | 'connected' | 'blocks';
  description?: string;
  createdAt: Date;
}
```

---

## Implementation Priority

**Phase 1: Core Mind Map (Week 1-2)**
- Basic mind map visualization
- Dimension → Element → Work hierarchy
- Pan, zoom, navigation
- Work detail panel

**Phase 2: Work Wizard (Week 2-3)**
- 5-step wizard flow
- Quick add option
- Save to Blue.cc API

**Phase 3: Connections (Week 3-4)**
- Visual arrow system
- Drag-to-connect
- Connection types
- Edit/delete connections

**Phase 4: Polish (Week 4-5)**
- Animations and transitions
- Keyboard shortcuts
- Alternative views (timeline, gantt)
- Mobile responsive
- Export/share

---

## Success Metrics

✅ **Can create a Work in under 60 seconds** (quick add)
✅ **Visual relationships immediately clear** (arrows work)
✅ **Natural to organize by context** (dimension → element flow)
✅ **Feels organic, not rigid** (mind map vs linear list)
✅ **Resources visible at a glance** (no hunting for info)

---

**This is your organic, flow-based planning system. Works are central. Context is everything. Relationships make the meaning.**
