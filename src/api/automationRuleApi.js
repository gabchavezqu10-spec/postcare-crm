import { supabase } from '../lib/supabaseClient';
const TABLE = 'automation_rules';
export const automationRuleApi = {
  async filter(filters = {}) {
    let q = supabase.from(TABLE).select('*');
    Object.entries(filters).forEach(([k, v]) => { q = q.eq(k, v); });
    const { data, error } = await q;
    if (error) throw error;
    return data;
  },
  async get(id) {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },
  async create(obj) {
    const { data, error } = await supabase.from(TABLE).insert(obj).select().single();
    if (error) throw error;
    return data;
  },
  async update(id, obj) {
    const { data, error } = await supabase.from(TABLE).update(obj).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  async delete(id) {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw error;
    return true;
  },
};