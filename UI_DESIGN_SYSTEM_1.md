# Inner Allies PMT - UI/UX Design System
## Inspired by BookArchitect's Visual Language

---

## Design Philosophy

The Inner Allies PMT adopts BookArchitect's sophisticated dark theme with glass morphism effects, creating a calm, focused environment that honors the contemplative nature of awakening work. The interface feels immersive without being overwhelming—like looking through clear water at night.

**Core Principles:**
- **Dark-first**: Deep slate backgrounds that reduce eye strain
- **Glass morphism**: Semi-transparent panels with backdrop blur
- **Subtle glow**: Soft shadows and light accents that guide attention
- **Purposeful animation**: Smooth transitions that feel alive, not distracting
- **Typography excellence**: Inter font family for clarity and elegance

---

## Color Palette

### Base Colors
```css
/* Background Layers */
--bg-primary: #0B1120;        /* Main background (slate-950) */
--bg-secondary: #1e293b;      /* Secondary elements (slate-800) */
--bg-tertiary: #334155;       /* Tertiary elements (slate-700) */

/* Glass Panels */
--glass-bg: rgba(30, 41, 59, 0.4);  /* slate-800 at 40% */
--glass-border: rgba(255, 255, 255, 0.05);
--glass-border-hover: rgba(59, 130, 246, 0.5);  /* blue-500 at 50% */

/* Text */
--text-primary: #E2E8F0;      /* Main text (slate-200) */
--text-secondary: #94A3B8;    /* Secondary text (slate-400) */
--text-tertiary: #64748B;     /* Tertiary text (slate-500) */
--text-heading: #FFFFFF;      /* Headings (white) */
```

### Dimension Colors (For Tags & Categories)
```css
/* Content Dimension - Blue */
--dimension-content-bg: rgba(59, 130, 246, 0.1);
--dimension-content-text: #3B82F6;
--dimension-content-border: rgba(59, 130, 246, 0.2);
--dimension-content-glow: rgba(59, 130, 246, 0.5);

/* Practice Dimension - Green */
--dimension-practice-bg: rgba(16, 185, 129, 0.1);
--dimension-practice-text: #10B981;
--dimension-practice-border: rgba(16, 185, 129, 0.2);
--dimension-practice-glow: rgba(16, 185, 129, 0.5);

/* Infrastructure Dimension - Purple */
--dimension-infrastructure-bg: rgba(139, 92, 246, 0.1);
--dimension-infrastructure-text: #8B5CF6;
--dimension-infrastructure-border: rgba(139, 92, 246, 0.2);
--dimension-infrastructure-glow: rgba(139, 92, 246, 0.5);

/* Marketing Dimension - Amber */
--dimension-marketing-bg: rgba(245, 158, 11, 0.1);
--dimension-marketing-text: #F59E0B;
--dimension-marketing-border: rgba(245, 158, 11, 0.2);
--dimension-marketing-glow: rgba(245, 158, 11, 0.5);

/* Community Dimension - Pink */
--dimension-community-bg: rgba(236, 72, 153, 0.1);
--dimension-community-text: #EC4899;
--dimension-community-border: rgba(236, 72, 153, 0.2);
--dimension-community-glow: rgba(236, 72, 153, 0.5);
```

### Status Colors
```css
/* Writing/In Progress - Orange */
--status-writing-bg: rgba(249, 115, 22, 0.1);
--status-writing-text: #F97316;
--status-writing-border: rgba(249, 115, 22, 0.2);
--status-writing-glow: rgba(249, 115, 22, 0.05);

/* Editing/Done - Green */
--status-done-bg: rgba(16, 185, 129, 0.1);
--status-done-text: #10B981;
--status-done-border: rgba(16, 185, 129, 0.2);
--status-done-glow: rgba(16, 185, 129, 0.05);

/* Paused/Blocked - Slate */
--status-paused-bg: rgba(51, 65, 85, 0.3);
--status-paused-text: #94A3B8;
--status-paused-border: rgba(51, 65, 85, 0.3);
```

---

## Typography System

### Font Families
```css
/* Primary Font - Inter */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

/* Monospace - JetBrains Mono (for code/data) */
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

### Type Scale
```css
.text-xs { font-size: 11px; line-height: 16px; }    /* Metadata, timestamps */
.text-sm { font-size: 13px; line-height: 20px; }    /* Labels, captions */
.text-base { font-size: 14px; line-height: 24px; }  /* Body text (default) */
.text-lg { font-size: 16px; line-height: 24px; }    /* Emphasis text */
.text-xl { font-size: 18px; line-height: 28px; }    /* Section headers */
.text-2xl { font-size: 24px; line-height: 32px; }   /* Page titles */
.text-3xl { font-size: 30px; line-height: 36px; }   /* Hero headings */

/* Headings are bold and tracking-tight */
h1, h2, h3 { 
  font-weight: 700; 
  letter-spacing: -0.025em; 
  color: #FFFFFF; 
}
```

---

## Component Styles

### Glass Panel (Base Container)
```css
.glass-panel {
  background: rgba(30, 41, 59, 0.4);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-panel:hover {
  border-color: rgba(59, 130, 246, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
}
```

### Task Card
```jsx
<div className="glass-panel rounded-xl p-5 group hover:border-blue-500/50 transition-all duration-300 cursor-pointer relative overflow-hidden">
  {/* Top accent line */}
  <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
  
  {/* Content */}
  <div className="flex justify-between items-start">
    <div className="flex-1">
      <h3 className="text-lg font-semibold text-white mb-2">
        Write Chapter 3: The Body as Classroom
      </h3>
      <p className="text-slate-400 text-sm leading-relaxed">
        Expand on shower experience from personal story
      </p>
      
      {/* Tags */}
      <div className="flex gap-2 mt-3">
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.05)]">
          #content
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.05)]">
          #book-1
        </span>
      </div>
    </div>
    
    {/* Status badge */}
    <div className="status-writing px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider">
      In Progress
    </div>
  </div>
</div>
```

### Mini Task Card (Collapsed)
```jsx
<div className="glass-panel rounded-lg p-3 h-20 flex items-center gap-4 hover:border-blue-500/50 transition-all cursor-pointer group">
  <div className="h-12 w-12 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-center flex-shrink-0">
    <Book size={20} className="text-slate-500" />
  </div>
  
  <div className="flex-1 min-w-0">
    <h4 className="text-sm font-semibold text-white truncate">
      Write Chapter 3
    </h4>
    <p className="text-xs text-slate-500 truncate">
      2 tags • Updated 2h ago
    </p>
  </div>
  
  <ChevronRight size={16} className="text-slate-600 group-hover:text-blue-500 transition-colors" />
</div>
```

### Progress Bar
```jsx
<div className="space-y-2">
  <div className="flex justify-between text-xs text-slate-400">
    <span>Progress</span>
    <span>12,500 / 50,000 words (25%)</span>
  </div>
  
  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
    <div 
      className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all duration-500"
      style={{ width: '25%' }}
    />
  </div>
</div>
```

### Button Styles
```jsx
{/* Primary Button */}
<button className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 active:scale-95">
  Create Task
</button>

{/* Secondary Button */}
<button className="px-4 py-2.5 bg-slate-800/60 text-slate-200 font-medium rounded-lg border border-white/10 hover:border-blue-500/50 hover:bg-slate-800 transition-all duration-200">
  Cancel
</button>

{/* Ghost Button */}
<button className="px-4 py-2.5 text-slate-400 font-medium rounded-lg hover:text-white hover:bg-slate-800/40 transition-all duration-200">
  Learn More
</button>

{/* Icon Button */}
<button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all duration-200">
  <Plus size={18} />
</button>
```

### Input Fields
```jsx
{/* Text Input */}
<input 
  type="text"
  className="w-full px-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-lg text-slate-200 placeholder-slate-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
  placeholder="Enter task title..."
/>

{/* Textarea */}
<textarea 
  className="w-full px-4 py-3 bg-slate-900/60 border border-white/10 rounded-lg text-slate-200 placeholder-slate-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all resize-none"
  rows={4}
  placeholder="Add description..."
/>

{/* Select Dropdown */}
<select className="px-4 py-2.5 bg-slate-900/60 border border-white/10 rounded-lg text-slate-200 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all cursor-pointer">
  <option>All Dimensions</option>
  <option>Content</option>
  <option>Practice</option>
  <option>Infrastructure</option>
</select>
```

### Tag System
```jsx
{/* Dimension Tag - Blue (Content) */}
<span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.05)] cursor-pointer hover:bg-blue-500/20 transition-all">
  <Hash size={12} />
  content
</span>

{/* Dimension Tag - Green (Practice) */}
<span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.05)] cursor-pointer hover:bg-emerald-500/20 transition-all">
  <Hash size={12} />
  practice
</span>

{/* Add Tag Button */}
<button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border-2 border-dashed border-slate-700 text-slate-500 hover:border-blue-500/50 hover:text-blue-500 transition-all">
  <Plus size={12} />
  Add Tag
</button>
```

### Status Badge
```jsx
{/* Writing Status */}
<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.05)]">
  <Activity size={12} className="animate-pulse" />
  <span className="text-xs font-semibold uppercase tracking-wider">Writing</span>
</div>

{/* Done Status */}
<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.05)]">
  <Check size={12} />
  <span className="text-xs font-semibold uppercase tracking-wider">Done</span>
</div>

{/* Paused Status */}
<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-700/30 text-slate-400 border border-slate-700/30">
  <Pause size={12} />
  <span className="text-xs font-semibold uppercase tracking-wider">Paused</span>
</div>
```

---

## Layout Structure

### Top Header
```jsx
<header className="glass-panel border-b border-white/5 px-6 py-4 sticky top-0 z-50">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-4">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
          <Lotus size={18} className="text-white" />
        </div>
        <h1 className="text-xl font-bold text-white tracking-tight">Inner Allies</h1>
      </div>
      
      {/* Connection Status */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
        <span className="text-xs font-medium text-emerald-500">Cloud Synced</span>
      </div>
    </div>
    
    <div className="flex items-center gap-3">
      {/* Search */}
      <button className="px-4 py-2 rounded-lg bg-slate-800/60 border border-white/10 text-slate-400 hover:text-white hover:border-blue-500/50 transition-all">
        <Search size={16} />
      </button>
      
      {/* User Menu */}
      <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/60 border border-white/10">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500"></div>
        <span className="text-sm font-medium text-slate-200">W.</span>
      </div>
    </div>
  </div>
</header>
```

### Sidebar Navigation
```jsx
<aside className="w-64 glass-panel border-r border-white/5 p-4 space-y-2">
  {/* Nav Item - Active */}
  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 font-medium transition-all">
    <List size={18} />
    <span>All Tasks</span>
    <span className="ml-auto px-2 py-0.5 rounded-full bg-blue-500/20 text-xs">42</span>
  </button>
  
  {/* Nav Item - Inactive */}
  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 font-medium transition-all">
    <Calendar size={18} />
    <span>Timeline</span>
  </button>
  
  <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 font-medium transition-all">
    <Target size={18} />
    <span>Readiness</span>
  </button>
  
  {/* Divider */}
  <div className="h-px bg-white/5 my-4"></div>
  
  {/* Section Header */}
  <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
    Dimensions
  </div>
  
  {/* Dimension Filters */}
  <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 transition-all">
    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
    <span className="text-sm">Content</span>
    <span className="ml-auto text-xs text-slate-500">24</span>
  </button>
  
  <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition-all">
    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
    <span className="text-sm">Practice</span>
    <span className="ml-auto text-xs text-slate-500">18</span>
  </button>
</aside>
```

### Main Content Area
```jsx
<main className="flex-1 p-6 overflow-y-auto">
  {/* Page Header */}
  <div className="mb-6">
    <h2 className="text-3xl font-bold text-white tracking-tight mb-2">All Tasks</h2>
    <p className="text-slate-400">Managing 42 tasks across 5 dimensions</p>
  </div>
  
  {/* Filter Bar */}
  <div className="glass-panel rounded-xl p-4 mb-6">
    <div className="flex gap-4">
      {/* ... filters ... */}
    </div>
  </div>
  
  {/* Content Grid */}
  <div className="grid gap-4">
    {/* Task cards go here */}
  </div>
</main>
```

---

## Animation System

### Fade In Animation
```css
@keyframes fade-in {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.5s ease-out;
}
```

### Stagger Children Animation
```jsx
// Apply to parent
<div className="space-y-4">
  {tasks.map((task, index) => (
    <div 
      key={task.id}
      className="animate-fade-in"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <TaskCard task={task} />
    </div>
  ))}
</div>
```

### Hover Effects
```css
/* Lift on hover */
.hover-lift {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.hover-lift:hover {
  transform: translateY(-2px);
}

/* Glow on hover */
.hover-glow:hover {
  box-shadow: 0 0 30px rgba(59, 130, 246, 0.3);
}
```

---

## Scrollbar Styling

```css
/* Webkit Browsers (Chrome, Safari, Edge) */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #334155; /* slate-700 */
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #475569; /* slate-600 */
}

/* Firefox */
* {
  scrollbar-width: thin;
  scrollbar-color: #334155 transparent;
}
```

---

## Responsive Breakpoints

```css
/* Mobile First Approach */
/* Default styles are for mobile */

/* Tablet: 768px and up */
@media (min-width: 768px) {
  .container {
    padding: 2rem;
  }
}

/* Desktop: 1024px and up */
@media (min-width: 1024px) {
  .container {
    padding: 3rem;
  }
}

/* Large Desktop: 1280px and up */
@media (min-width: 1280px) {
  .container {
    max-width: 1280px;
    margin: 0 auto;
  }
}
```

---

## Special Components

### Timeline Phase Card
```jsx
<div className="glass-panel rounded-xl overflow-hidden">
  {/* Header - Clickable */}
  <button 
    onClick={toggleExpand}
    className="w-full px-6 py-5 flex justify-between items-center hover:bg-slate-800/40 transition-all"
  >
    <div>
      <h3 className="text-xl font-bold text-white tracking-tight mb-1">
        Phase 1: Recognition Filters
      </h3>
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-400">Q1 2026</span>
        <span className="text-xs text-slate-500">•</span>
        <span className="text-sm text-emerald-500">3 / 5 milestones complete</span>
      </div>
    </div>
    
    <ChevronDown 
      size={24} 
      className={`text-slate-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
    />
  </button>
  
  {/* Expandable Content */}
  {isExpanded && (
    <div className="px-6 pb-6 space-y-4 border-t border-white/5">
      {/* Milestone cards */}
    </div>
  )}
</div>
```

### Readiness Card
```jsx
<div className="glass-panel rounded-xl p-6 border-2 border-emerald-500/30 bg-emerald-500/5">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-semibold text-white">Content Ready</h3>
    <div className="px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-500 text-xs font-bold uppercase tracking-wider">
      Ready
    </div>
  </div>
  
  <div className="text-4xl font-bold text-emerald-500 mb-6">
    10 / 10
  </div>
  
  <div className="space-y-2">
    {items.map(item => (
      <div key={item.id} className="flex items-center gap-3 text-sm">
        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
          item.completed 
            ? 'bg-emerald-500/20 text-emerald-500' 
            : 'bg-slate-800 text-slate-600'
        }`}>
          {item.completed && <Check size={12} />}
        </div>
        <span className={item.completed ? 'text-emerald-400' : 'text-slate-500'}>
          {item.name}
        </span>
      </div>
    ))}
  </div>
</div>
```

### Quick Capture Floating Button
```jsx
<div className="fixed bottom-6 right-6 z-50">
  {isOpen ? (
    <div className="glass-panel rounded-2xl p-6 w-96 shadow-2xl border-blue-500/20 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Quick Insight</h3>
        <button 
          onClick={close}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all"
        >
          <X size={18} />
        </button>
      </div>
      
      <textarea
        className="w-full px-4 py-3 bg-slate-900/60 border border-white/10 rounded-lg text-slate-200 placeholder-slate-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all resize-none mb-4"
        rows={4}
        placeholder="What did you discover?"
        autoFocus
      />
      
      <button className="w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-lg shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all">
        Capture
      </button>
    </div>
  ) : (
    <button 
      onClick={open}
      className="px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium rounded-full shadow-2xl shadow-emerald-500/40 hover:shadow-emerald-500/60 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
    >
      <Lightbulb size={20} />
      Quick Insight
    </button>
  )}
</div>
```

---

## Implementation in Tailwind Config

```javascript
// tailwind.config.js
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'slate-950': '#0B1120',
        'dimension-content': '#3B82F6',
        'dimension-practice': '#10B981',
        'dimension-infrastructure': '#8B5CF6',
        'dimension-marketing': '#F59E0B',
        'dimension-community': '#EC4899',
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-out',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        }
      },
      backdropBlur: {
        'xs': '2px',
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.3)',
        'glow-green': '0 0 20px rgba(16, 185, 129, 0.3)',
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.3)',
      }
    },
  },
  plugins: [],
}
```

---

## CSS Custom Classes

```css
/* src/index.css */
@import "tailwindcss";

@layer base {
  html, body, #root {
    height: 100%;
    margin: 0;
    font-size: 14px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: #0B1120;
  }

  body {
    @apply text-slate-200 transition-colors duration-300 leading-relaxed;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }

  body::selection {
    background-color: rgba(59, 130, 246, 0.3);
  }

  h1, h2, h3 {
    @apply font-bold tracking-tight text-white;
  }

  input:focus, textarea:focus, select:focus {
    @apply ring-2 ring-blue-500/20 border-blue-500/50 outline-none;
  }
}

@layer components {
  .glass-panel {
    @apply bg-slate-800/40 backdrop-blur-xl border border-white/5 shadow-xl;
  }

  .status-writing {
    @apply bg-orange-500/10 text-orange-500 border border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.05)];
  }

  .status-done {
    @apply bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.05)];
  }

  .status-paused {
    @apply bg-slate-700/30 text-slate-400 border border-slate-700/30;
  }

  .dimension-tag-content {
    @apply bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.05)];
  }

  .dimension-tag-practice {
    @apply bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.05)];
  }

  .dimension-tag-infrastructure {
    @apply bg-purple-500/10 text-purple-500 border border-purple-500/20 shadow-[0_0_10px_rgba(139,92,246,0.05)];
  }
}
```

---

## Dark Mode Only

This design system is **dark mode only**. The deep backgrounds and glass morphism effects are designed specifically for dark environments and create the contemplative, focused atmosphere needed for awakening work.

---

## Accessibility Considerations

```css
/* Focus Visible for Keyboard Navigation */
*:focus-visible {
  outline: 2px solid rgba(59, 130, 246, 0.5);
  outline-offset: 2px;
}

/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* High Contrast Colors for Text */
.text-high-contrast {
  color: #FFFFFF;
  text-shadow: 0 0 1px rgba(0, 0, 0, 0.5);
}
```

---

## Usage Example: Complete Task List Page

```jsx
export default function TaskListPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="glass-panel border-b border-white/5 px-6 py-4 sticky top-0 z-50">
        {/* ... header content ... */}
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 glass-panel border-r border-white/5 p-4">
          {/* ... sidebar content ... */}
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Page Title */}
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-white tracking-tight mb-2">
              All Tasks
            </h2>
            <p className="text-slate-400">
              Managing 42 tasks across 5 dimensions
            </p>
          </div>

          {/* Filters */}
          <div className="glass-panel rounded-xl p-4 mb-6">
            <div className="flex gap-4">
              {/* Filter controls */}
            </div>
          </div>

          {/* Task Grid */}
          <div className="grid gap-4">
            {tasks.map((task, index) => (
              <div
                key={task.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <TaskCard task={task} />
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Quick Capture Floating Button */}
      <QuickCapture />
    </div>
  );
}
```

---

**This design system creates the same sophisticated, calm, focused aesthetic as BookArchitect, perfectly suited for the contemplative nature of the Inner Allies awakening work. The glass morphism, subtle glows, and dark theme create an immersive environment that feels alive without being distracting.**

**Apply these styles to every component in the PROJECT_PLAN_V1.md and you'll have a beautiful, cohesive interface that honors the depth of the work.**
