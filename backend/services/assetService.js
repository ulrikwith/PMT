import supabase from './supabase.js';

class AssetService {
  // ─── List Assets ─────────────────────────────────────────────
  async getAssets(userId, filters = {}) {
    try {
      let query = supabase
        .from('assets')
        .select('*')
        .eq('user_id', userId)
        .is('archived_at', null)
        .order('created_at', { ascending: false });

      if (filters.dimension) {
        query = query.eq('dimension', filters.dimension);
      }
      if (filters.phase) {
        query = query.eq('phase', filters.phase);
      }
      if (filters.type) {
        query = query.eq('type', filters.type);
      }
      if (filters.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
        );
      }

      const { data, error } = await query;

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, data: data || [] };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // ─── Get Single Asset ────────────────────────────────────────
  async getAsset(userId, assetId) {
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .eq('id', assetId)
        .eq('user_id', userId)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // ─── Create Asset ───────────────────────────────────────────
  async createAsset(userId, assetData) {
    try {
      const { name, type, description, purpose, audience, dimension, current_focus, next_milestone, next_milestone_date } = assetData;

      if (!name || typeof name !== 'string' || !name.trim()) {
        return { success: false, error: 'Asset name is required' };
      }

      const { data, error } = await supabase
        .from('assets')
        .insert([{
          user_id: userId,
          name: name.trim(),
          type: type || 'product',
          description: description || '',
          purpose: purpose || '',
          audience: audience || '',
          dimension: dimension || null,
          current_focus: current_focus || '',
          next_milestone: next_milestone || '',
          next_milestone_date: next_milestone_date || null,
          phase: 'concept',
          phase_entered_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // ─── Update Asset ───────────────────────────────────────────
  async updateAsset(userId, assetId, updates) {
    try {
      // Only allow safe fields to be updated
      const allowedFields = [
        'name', 'type', 'description', 'purpose', 'audience',
        'dimension', 'current_focus', 'next_milestone', 'next_milestone_date',
        'health_metrics',
      ];
      const safeUpdates = {};
      for (const key of allowedFields) {
        if (updates[key] !== undefined) {
          safeUpdates[key] = updates[key];
        }
      }

      safeUpdates.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('assets')
        .update(safeUpdates)
        .eq('id', assetId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // ─── Update Phase (with history tracking) ───────────────────
  async updatePhase(userId, assetId, newPhase) {
    try {
      const VALID_PHASES = ['concept', 'development', 'launch', 'growth', 'maturity', 'decline', 'sunset'];
      if (!VALID_PHASES.includes(newPhase)) {
        return { success: false, error: `Invalid phase: ${newPhase}` };
      }

      // Get current asset to read phase_history
      const { data: current, error: fetchError } = await supabase
        .from('assets')
        .select('phase, phase_history')
        .eq('id', assetId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !current) {
        return { success: false, error: fetchError?.message || 'Asset not found' };
      }

      if (current.phase === newPhase) {
        return { success: false, error: 'Asset is already in this phase' };
      }

      // Append to phase_history
      const updatedHistory = [
        ...(current.phase_history || []),
        {
          from: current.phase,
          to: newPhase,
          date: new Date().toISOString(),
        },
      ];

      const { data, error } = await supabase
        .from('assets')
        .update({
          phase: newPhase,
          phase_entered_at: new Date().toISOString(),
          phase_history: updatedHistory,
          updated_at: new Date().toISOString(),
        })
        .eq('id', assetId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // ─── Archive Asset (soft delete) ────────────────────────────
  async archiveAsset(userId, assetId) {
    try {
      const { data, error } = await supabase
        .from('assets')
        .update({
          archived_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', assetId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // ─── Restore Asset ──────────────────────────────────────────
  async restoreAsset(userId, assetId) {
    try {
      const { data, error } = await supabase
        .from('assets')
        .update({
          archived_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', assetId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // ─── Link Task to Asset ─────────────────────────────────────
  async linkTask(userId, assetId, taskId) {
    try {
      const { data: asset, error: fetchError } = await supabase
        .from('assets')
        .select('linked_task_ids')
        .eq('id', assetId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !asset) {
        return { success: false, error: fetchError?.message || 'Asset not found' };
      }

      const currentIds = asset.linked_task_ids || [];
      if (currentIds.includes(taskId)) {
        return { success: true, data: asset, message: 'Task already linked' };
      }

      const { data, error } = await supabase
        .from('assets')
        .update({
          linked_task_ids: [...currentIds, taskId],
          updated_at: new Date().toISOString(),
        })
        .eq('id', assetId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // ─── Unlink Task from Asset ─────────────────────────────────
  async unlinkTask(userId, assetId, taskId) {
    try {
      const { data: asset, error: fetchError } = await supabase
        .from('assets')
        .select('linked_task_ids')
        .eq('id', assetId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !asset) {
        return { success: false, error: fetchError?.message || 'Asset not found' };
      }

      const currentIds = asset.linked_task_ids || [];
      const updatedIds = currentIds.filter((id) => id !== taskId);

      const { data, error } = await supabase
        .from('assets')
        .update({
          linked_task_ids: updatedIds,
          updated_at: new Date().toISOString(),
        })
        .eq('id', assetId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
}

export default new AssetService();
