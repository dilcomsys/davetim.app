import toast from 'react-hot-toast';
import { supabase } from './supabase';

export interface Guest {
  id: string;
  invitation_id: string;
  full_name: string;
  email?: string;
  phone?: string;
  rsvp_status: 'pending' | 'attending' | 'declined';
  companion_count: number;
  dietary_restrictions?: string;
  notes?: string;
  rsvp_responded_at?: string;
  guest_token: string;
  created_at: string;
  updated_at: string;
}

export interface CreateGuestData {
  invitation_id: string;
  full_name: string;
  email?: string;
  phone?: string;
  companion_count?: number;
  notes?: string;
}

export interface UpdateGuestData {
  full_name?: string;
  email?: string;
  phone?: string;
  companion_count?: number;
  notes?: string;
}

export interface RSVPData {
  rsvp_status: 'attending' | 'declined';
  companion_count?: number;
  dietary_restrictions?: string;
  notes?: string;
}

export interface GuestStats {
  total: number;
  pending: number;
  attending: number;
  declined: number;
  total_companions: number;
  total_attending: number;
}

class GuestService {
  /**
   * Get all guests for an invitation
   */
  async getInvitationGuests(invitationId: string): Promise<Guest[]> {
    try {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('invitation_id', invitationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Get guests error:', error);
        throw new Error(error.message);
      }

      return data || [];
    } catch (error: any) {
      console.error('❌ Get guests error:', error);
      toast.error('Davetli listesi yüklenemedi');
      throw error;
    }
  }

  /**
   * Get guest statistics for an invitation
   */
  async getGuestStats(invitationId: string): Promise<GuestStats> {
    try {
      const { data, error } = await supabase
        .rpc('get_invitation_guest_stats', { invitation_uuid: invitationId });

      if (error) {
        console.error('❌ Get guest stats error:', error);
        throw new Error(error.message);
      }

      return data || {
        total: 0,
        pending: 0,
        attending: 0,
        declined: 0,
        total_companions: 0,
        total_attending: 0
      };
    } catch (error: any) {
      console.error('❌ Get guest stats error:', error);
      // Return empty stats instead of throwing
      return {
        total: 0,
        pending: 0,
        attending: 0,
        declined: 0,
        total_companions: 0,
        total_attending: 0
      };
    }
  }

  /**
   * Get a guest by token (for RSVP)
   */
  async getGuestByToken(token: string): Promise<Guest | null> {
    try {
      const { data, error } = await supabase
        .from('guests')
        .select('*')
        .eq('guest_token', token)
        .single();

      if (error) {
        console.error('❌ Get guest by token error:', error);
        return null;
      }

      return data;
    } catch (error: any) {
      console.error('❌ Get guest by token error:', error);
      return null;
    }
  }

  /**
   * Create a new guest
   */
  async createGuest(guestData: CreateGuestData): Promise<Guest | null> {
    try {
      // Generate unique guest token
      const guestToken = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      
      const { data, error } = await supabase
        .from('guests')
        .insert([{
          invitation_id: guestData.invitation_id,
          full_name: guestData.full_name,
          email: guestData.email || null,
          phone: guestData.phone || null,
          companion_count: guestData.companion_count || 0,
          notes: guestData.notes || null,
          rsvp_status: 'pending',
          guest_token: guestToken
        }])
        .select()
        .single();

      if (error) {
        console.error('❌ Create guest error:', error);
        throw new Error(error.message);
      }

      console.log('✅ Guest created successfully');
      toast.success('Davetli eklendi');
      return data;
    } catch (error: any) {
      console.error('❌ Create guest error:', error);
      toast.error('Davetli eklenemedi: ' + error.message);
      throw error;
    }
  }

  /**
   * Update a guest
   */
  async updateGuest(guestId: string, updates: UpdateGuestData): Promise<Guest | null> {
    try {
      const { data, error } = await supabase
        .from('guests')
        .update(updates)
        .eq('id', guestId)
        .select()
        .single();

      if (error) {
        console.error('❌ Update guest error:', error);
        throw new Error(error.message);
      }

      console.log('✅ Guest updated successfully');
      toast.success('Davetli güncellendi');
      return data;
    } catch (error: any) {
      console.error('❌ Update guest error:', error);
      toast.error('Davetli güncellenemedi: ' + error.message);
      throw error;
    }
  }

  /**
   * Delete a guest
   */
  async deleteGuest(guestId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('guests')
        .delete()
        .eq('id', guestId);

      if (error) {
        console.error('❌ Delete guest error:', error);
        throw new Error(error.message);
      }

      console.log('✅ Guest deleted successfully');
      toast.success('Davetli silindi');
      return true;
    } catch (error: any) {
      console.error('❌ Delete guest error:', error);
      toast.error('Davetli silinemedi: ' + error.message);
      throw error;
    }
  }

  /**
   * Submit RSVP response
   */
  async submitRSVP(guestToken: string, rsvpData: RSVPData): Promise<Guest | null> {
    try {
      const { data, error } = await supabase
        .from('guests')
        .update({
          rsvp_status: rsvpData.rsvp_status,
          companion_count: rsvpData.companion_count || 0,
          dietary_restrictions: rsvpData.dietary_restrictions || null,
          notes: rsvpData.notes || null,
          rsvp_responded_at: new Date().toISOString()
        })
        .eq('guest_token', guestToken)
        .select()
        .single();

      if (error) {
        console.error('❌ Submit RSVP error:', error);
        throw new Error(error.message);
      }

      console.log('✅ RSVP submitted successfully');
      toast.success('Yanıtınız kaydedildi. Teşekkür ederiz!');
      return data;
    } catch (error: any) {
      console.error('❌ Submit RSVP error:', error);
      toast.error('RSVP kaydedilemedi: ' + error.message);
      throw error;
    }
  }

  /**
   * Bulk import guests (from CSV/Excel)
   */
  async bulkImportGuests(invitationId: string, guests: CreateGuestData[]): Promise<number> {
    try {
      const guestsToInsert = guests.map(guest => ({
        invitation_id: invitationId,
        full_name: guest.full_name,
        email: guest.email || null,
        phone: guest.phone || null,
        companion_count: guest.companion_count || 0,
        notes: guest.notes || null,
        rsvp_status: 'pending'
      }));

      const { data, error } = await supabase
        .from('guests')
        .insert(guestsToInsert)
        .select();

      if (error) {
        console.error('❌ Bulk import error:', error);
        throw new Error(error.message);
      }

      const count = data?.length || 0;
      console.log(`✅ ${count} guests imported successfully`);
      toast.success(`${count} davetli başarıyla eklendi`);
      return count;
    } catch (error: any) {
      console.error('❌ Bulk import error:', error);
      toast.error('Toplu ekleme başarısız: ' + error.message);
      throw error;
    }
  }

  /**
   * Get guest count for an invitation
   */
  async getGuestCount(invitationId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('guests')
        .select('*', { count: 'exact', head: true })
        .eq('invitation_id', invitationId);

      if (error) {
        console.error('Get guest count error:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Get guest count error:', error);
      return 0;
    }
  }

  /**
   * Generate RSVP link for a guest
   */
  getGuestRSVPLink(guestToken: string): string {
    return `${window.location.origin}/rsvp/${guestToken}`;
  }

  /**
   * Copy RSVP link to clipboard
   */
  copyRSVPLink(guestToken: string): void {
    const link = this.getGuestRSVPLink(guestToken);
    navigator.clipboard.writeText(link);
    toast.success('RSVP linki kopyalandı');
  }
}

export const guestService = new GuestService();

