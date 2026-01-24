import { Book, User, Users, Megaphone, Settings } from 'lucide-react';

export const DIMENSIONS = [
  {
    id: 'content',
    label: 'Content',
    color: 'blue',
    icon: Book,
    elements: [
      { id: 'books', label: 'Books' },
      { id: 'substack', label: 'Substack' },
      { id: 'newsletter', label: 'Newsletter' },
      { id: 'stone', label: 'Stone' }, // Shared element
      { id: 'other', label: 'Other' },
    ],
  },
  {
    id: 'practice',
    label: 'Practices',
    color: 'emerald',
    icon: User,
    elements: [
      { id: 'stone', label: 'Stone' }, // Shared element
      { id: 'walk', label: 'Walk' },
      { id: 'b2b', label: 'B2B' },
      { id: 'other', label: 'Other' },
    ],
  },
  {
    id: 'community',
    label: 'Community',
    color: 'pink',
    icon: Users,
    elements: [
      { id: 'mission', label: 'Mission' },
      { id: 'development', label: 'Development' },
      { id: 'first30', label: 'First 30' },
      { id: 'other', label: 'Other' },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    color: 'amber',
    icon: Megaphone,
    elements: [
      { id: 'bopa', label: 'BOPA' },
      { id: 'website', label: 'Website' },
      { id: 'other', label: 'Other' },
    ],
  },
  {
    id: 'admin',
    label: 'Admin',
    color: 'purple',
    icon: Settings,
    elements: [
      { id: 'planning', label: 'Planning' },
      { id: 'accounting', label: 'Accounting' },
      { id: 'other', label: 'Other' },
    ],
  },
];

export const getDimensionConfig = (dimId) => {
  if (!dimId) return null;
  return DIMENSIONS.find((d) => d.id === dimId.toLowerCase());
};

export const getElementLabel = (dimId, elementId) => {
  const dim = getDimensionConfig(dimId);
  if (!dim) return elementId;
  const el = dim.elements.find((e) => e.id === elementId?.toLowerCase() || e.label === elementId);
  return el ? el.label : elementId;
};
