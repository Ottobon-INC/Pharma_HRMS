import { supabase } from '../supabase-client';

export async function addProof(
  visitId: string,
  proofType: 'photo' | 'note' | 'signature' | 'otp' | 'document',
  content: string,
  latitude?: number,
  longitude?: number
): Promise<void> {
  const { error } = await supabase
    .from('pharma_hrms_field_visit_proofs')
    .insert([{
      visit_id: visitId,
      proof_type: proofType,
      content,
      latitude,
      longitude
    }]);

  if (error) throw error;
}
