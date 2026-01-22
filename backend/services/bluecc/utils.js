export function parseTaskText(text) {
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
        const parsed = JSON.parse(jsonMeta);
        return {
          description,
          metadata: {
            workType: parsed.wt || parsed.workType,
            targetOutcome: parsed.to || parsed.targetOutcome,
            activities: parsed.a || parsed.activities || [],
            resources: parsed.r || parsed.resources || {},
            position: parsed.p || parsed.position,
            gridPosition: parsed.g || parsed.gridPosition,
            deletedAt: parsed.d || parsed.deletedAt
          }
        };
      } catch (e) {
        return { description: text, metadata: {} };
      }
    }
  }

  return { description: text, metadata: {} };
}

export function buildTaskText(description, metadata) {
  if (!metadata || Object.keys(metadata).every(k => !metadata[k])) {
    return description || '';
  }

  const compactMeta = {
    wt: metadata.workType,
    to: metadata.targetOutcome,
    a: metadata.activities || [],
    r: metadata.resources || {},
    p: metadata.position,
    g: metadata.gridPosition,
    d: metadata.deletedAt
  };

  Object.keys(compactMeta).forEach(k => {
    if (compactMeta[k] === null || compactMeta[k] === undefined) {
      delete compactMeta[k];
    }
  });

  const base64Meta = Buffer.from(JSON.stringify(compactMeta)).toString('base64');
  return `${description || ''}\n\n---PMT-META---\n${base64Meta}`;
}
