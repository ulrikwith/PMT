import type { ParsedTaskText, TaskMetadata } from '../../types/index.js';

/**
 * Compact metadata format for efficient storage (can have both compact and full names)
 */
interface CompactMetadata {
  // Compact property names
  wt?: string;
  to?: string;
  a?: any[];
  r?: Record<string, any>;
  p?: { x: number; y: number };
  g?: { x: number; y: number };
  d?: string | null;
  // Full property names (for backward compatibility)
  workType?: string;
  targetOutcome?: string;
  activities?: any[];
  resources?: Record<string, any>;
  position?: { x: number; y: number };
  gridPosition?: { x: number; y: number };
  deletedAt?: string | null;
}

/**
 * Parse task text to extract description and metadata
 * @param text - The raw task text with embedded metadata
 * @returns Parsed description and metadata object
 */
export function parseTaskText(text: string | null | undefined): ParsedTaskText {
  if (!text) {
    return { description: '', metadata: {} };
  }

  const metaMarker = '---PMT-META---';

  if (text.includes(metaMarker)) {
    const parts = text.split(metaMarker);
    const description = parts[0].trim();

    const rawMeta = parts[1] || '';
    const base64Meta = rawMeta.replace(/<[^>]*>/g, '').replace(/\s/g, '');

    if (base64Meta) {
      try {
        const jsonMeta = Buffer.from(base64Meta, 'base64').toString('utf-8');
        const parsed = JSON.parse(jsonMeta) as CompactMetadata;
        return {
          description,
          metadata: {
            workType: parsed.wt || parsed.workType,
            targetOutcome: parsed.to || parsed.targetOutcome,
            activities: parsed.a || parsed.activities || [],
            resources: parsed.r || parsed.resources || {},
            position: parsed.p || parsed.position,
            gridPosition: parsed.g || parsed.gridPosition,
            deletedAt: parsed.d || parsed.deletedAt,
          },
        };
      } catch (e) {
        const error = e as Error;
        console.error('Failed to parse task metadata:', {
          error: error.message,
          base64Meta: base64Meta.substring(0, 50) + '...', // Log first 50 chars
          textPreview: text.substring(0, 100),
        });
        return { description: text, metadata: {} };
      }
    }
  }

  return { description: text, metadata: {} };
}

/**
 * Build task text with embedded metadata
 * @param description - The task description
 * @param metadata - The metadata to embed
 * @returns Text with embedded base64-encoded metadata
 */
export function buildTaskText(
  description: string | undefined,
  metadata: TaskMetadata | null | undefined
): string {
  if (!metadata || Object.keys(metadata).every((k) => !metadata[k as keyof TaskMetadata])) {
    return description || '';
  }

  const compactMeta: CompactMetadata = {
    wt: metadata.workType,
    to: metadata.targetOutcome,
    a: metadata.activities || [],
    r: metadata.resources || {},
    p: metadata.position,
    g: metadata.gridPosition,
    d: metadata.deletedAt,
  };

  // Remove null/undefined values
  Object.keys(compactMeta).forEach((k) => {
    const key = k as keyof CompactMetadata;
    if (compactMeta[key] === null || compactMeta[key] === undefined) {
      delete compactMeta[key];
    }
  });

  try {
    const jsonString = JSON.stringify(compactMeta);
    const base64Meta = Buffer.from(jsonString).toString('base64');
    return `${description || ''}\n\n---PMT-META---\n${base64Meta}`;
  } catch (e) {
    const error = e as Error;
    console.error('Failed to serialize task metadata:', {
      error: error.message,
      metadata: compactMeta,
    });
    // Fallback to description only
    return description || '';
  }
}
