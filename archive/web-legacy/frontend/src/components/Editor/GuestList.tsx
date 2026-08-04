import React, { useState, useEffect } from 'react';
import { UserPlus, Mail, Phone, Trash2, Edit2, Link2, Check, X, Loader2, FileSpreadsheet, Download, Lock, Users } from 'lucide-react';
import { guestService, type Guest, type CreateGuestData, type GuestStats } from '../../services/guestService';
import { excelService } from '../../services/excelService';
import { useSubscription } from '../../hooks/useSubscription';
import toast from 'react-hot-toast';
import { validateName, validateEmail, validatePhone, formatPhoneNumber } from '../../utils/validation';
import ConfirmDialog from '../Common/ConfirmDialog';

interface GuestListProps {
  invitationId: string;
  invitationTitle?: string;
  invitationStatus?: 'draft' | 'published' | 'archived';
}

const GuestList: React.FC<GuestListProps> = ({ invitationId, invitationTitle = 'Davetiye', invitationStatus = 'draft' }) => {
  const subscription = useSubscription();
  
  const [guests, setGuests] = useState<Guest[]>([]);
  const [stats, setStats] = useState<GuestStats>({
    total: 0,
    pending: 0,
    attending: 0,
    declined: 0,
    total_companions: 0,
    total_attending: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingGuest, setIsAddingGuest] = useState(false);
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<CreateGuestData>({
    invitation_id: invitationId,
    full_name: '',
    email: '',
    phone: '',
    companion_count: 0,
    notes: ''
  });

  // Form validation errors
  const [errors, setErrors] = useState({
    full_name: '',
    email: '',
    phone: ''
  });

  // Confirm dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [guestToDelete, setGuestToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load guests
  useEffect(() => {
    loadGuests();
  }, [invitationId]);

  const loadGuests = async () => {
    try {
      setIsLoading(true);
      const guestsData = await guestService.getInvitationGuests(invitationId);
      setGuests(guestsData);
      
      // Calculate stats from guests data
      const calculatedStats: GuestStats = {
        total: guestsData.length,
        pending: guestsData.filter(g => g.rsvp_status === 'pending').length,
        attending: guestsData.filter(g => g.rsvp_status === 'attending').length,
        declined: guestsData.filter(g => g.rsvp_status === 'declined').length,
        total_companions: guestsData.reduce((sum, g) => sum + (g.companion_count || 0), 0),
        total_attending: guestsData
          .filter(g => g.rsvp_status === 'attending')
          .reduce((sum, g) => sum + 1 + (g.companion_count || 0), 0)
      };
      
      setStats(calculatedStats);
    } catch (error) {
      console.error('Error loading guests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Validate guest form
  const validateGuestForm = (): boolean => {
    const newErrors = {
      full_name: '',
      email: '',
      phone: ''
    };

    // Name validation (required)
    const nameResult = validateName(formData.full_name, 'Ad Soyad');
    if (!nameResult.isValid) {
      newErrors.full_name = nameResult.error!;
    }

    // Email validation (optional)
    if (formData.email && formData.email.trim() !== '') {
      const emailResult = validateEmail(formData.email);
      if (!emailResult.isValid) {
        newErrors.email = emailResult.error!;
      }
    }

    // Phone validation (optional)
    if (formData.phone && formData.phone.trim() !== '') {
      const phoneResult = validatePhone(formData.phone);
      if (!phoneResult.isValid) {
        newErrors.phone = phoneResult.error!;
      }
    }

    setErrors(newErrors);

    // Check if there are any errors
    const hasErrors = Object.values(newErrors).some(error => error !== '');
    
    if (hasErrors) {
      const firstError = Object.values(newErrors).find(error => error !== '');
      toast.error(firstError || 'Lütfen formu kontrol edin', { duration: 5000 });
    }

    return !hasErrors;
  };

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateGuestForm()) {
      return;
    }

    // Guest limit kontrolü
    const guestCheck = await subscription.canAddGuest(invitationId, guests.length);
    if (!guestCheck.allowed) {
      toast.error(guestCheck.reason || 'Davetli limitine ulaştınız!');
      return;
    }

    try {
      await guestService.createGuest(formData);
      await loadGuests();
      
      // Reset form
      setFormData({
        invitation_id: invitationId,
        full_name: '',
        email: '',
        phone: '',
        companion_count: 0,
        notes: ''
      });
      setIsAddingGuest(false);
    } catch (error) {
      console.error('Error adding guest:', error);
    }
  };

  const handleUpdateGuest = async (guestId: string) => {
    // Validate form
    if (!validateGuestForm()) {
      return;
    }

    try{
      await guestService.updateGuest(guestId, {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        companion_count: formData.companion_count,
        notes: formData.notes
      });
      await loadGuests();
      setEditingGuestId(null);
      setFormData({
        invitation_id: invitationId,
        full_name: '',
        email: '',
        phone: '',
        companion_count: 0,
        notes: ''
      });
    } catch (error) {
      console.error('Error updating guest:', error);
    }
  };

  const handleDeleteClick = (guest: Guest) => {
    setGuestToDelete({ id: guest.id, name: guest.full_name });
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!guestToDelete) return;

    setIsDeleting(true);
    try {
      await guestService.deleteGuest(guestToDelete.id);
      await loadGuests();
      setShowDeleteDialog(false);
      setGuestToDelete(null);
    } catch (error) {
      console.error('Error deleting guest:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditClick = (guest: Guest) => {
    setEditingGuestId(guest.id);
    setFormData({
      invitation_id: invitationId,
      full_name: guest.full_name,
      email: guest.email || '',
      phone: guest.phone || '',
      companion_count: guest.companion_count,
      notes: guest.notes || ''
    });
    setIsAddingGuest(false);
  };

  const handleCancelEdit = () => {
    setEditingGuestId(null);
    setIsAddingGuest(false);
    setFormData({
      invitation_id: invitationId,
      full_name: '',
      email: '',
      phone: '',
      companion_count: 0,
      notes: ''
    });
  };

  const getRSVPBadge = (status: string) => {
    switch (status) {
      case 'attending':
        return <span className="px-1.5 py-0.5 text-xs rounded bg-green-100 text-green-700 font-medium">Gelecek</span>;
      case 'declined':
        return <span className="px-1.5 py-0.5 text-xs rounded bg-red-100 text-red-700 font-medium">Gelemeyecek</span>;
      default:
        return <span className="px-1.5 py-0.5 text-xs rounded bg-gray-100 text-gray-600 font-medium">Bekliyor</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Statistics - Minimal Cards */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-xs text-gray-500 mt-0.5">Toplam</div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{stats.attending}</div>
          <div className="text-xs text-gray-500 mt-0.5">Gelecek</div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-xs text-gray-500 mt-0.5">Bekliyor</div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="text-2xl font-bold text-red-600">{stats.declined}</div>
          <div className="text-xs text-gray-500 mt-0.5">Gelemeyecek</div>
        </div>
      </div>

      {/* Total Attending - Compact */}
      {stats.total_attending > 0 && (
        <div className="bg-primary-50 rounded-lg p-3 border border-primary-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Toplam Katılımcı</span>
            <span className="text-lg font-bold text-primary-700">{stats.total_attending}</span>
          </div>
        </div>
      )}

      {/* Action Buttons - Minimal */}
      <div className="flex flex-wrap gap-2">
        {!isAddingGuest && !editingGuestId && (
          <>
            <button
              onClick={() => setIsAddingGuest(true)}
              className="flex items-center gap-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <UserPlus className="h-4 w-4" />
              <span>Yeni Davetli</span>
            </button>
            
            {guests.length > 0 && (
              <>
                <button
                  onClick={async () => {
                    const access = await subscription.canExportExcel();
                    if (!access.allowed) {
                      toast.error(access.reason || 'Excel export için PRO plana yükseltin!');
                      return;
                    }
                    excelService.exportGuestsToExcel(guests, invitationTitle);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    subscription.planConfig?.limits.excelExport
                      ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  title={
                    subscription.planConfig?.limits.excelExport 
                      ? "Excel listesi indir"
                      : "PRO plana yükseltin"
                  }
                  disabled={!subscription.planConfig?.limits.excelExport}
                >
                  {!subscription.planConfig?.limits.excelExport && <Lock className="h-4 w-4" />}
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Excel</span>
                </button>
                
                <button
                  onClick={async () => {
                    const access = await subscription.canExportExcel();
                    if (!access.allowed) {
                      toast.error(access.reason || 'Excel export için PRO plana yükseltin!');
                      return;
                    }
                    excelService.exportGuestsWithStats(guests, invitationTitle, stats);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    subscription.planConfig?.limits.excelExport
                      ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  title={
                    subscription.planConfig?.limits.excelExport
                      ? "Detaylı rapor indir"
                      : "PRO plana yükseltin"
                  }
                  disabled={!subscription.planConfig?.limits.excelExport}
                >
                  {!subscription.planConfig?.limits.excelExport && <Lock className="h-4 w-4" />}
                  <FileSpreadsheet className="h-4 w-4" />
                  <span className="hidden sm:inline">Rapor</span>
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Guest Form - Minimal */}
      {(isAddingGuest || editingGuestId) && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            {editingGuestId ? 'Davetli Düzenle' : 'Yeni Davetli Ekle'}
          </h3>
          <form onSubmit={editingGuestId ? (e) => { e.preventDefault(); handleUpdateGuest(editingGuestId); } : handleAddGuest} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Ad Soyad <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => {
                    setFormData({ ...formData, full_name: e.target.value });
                    if (errors.full_name) setErrors({ ...errors, full_name: '' });
                  }}
                  onBlur={(e) => {
                    const result = validateName(e.target.value, 'Ad Soyad');
                    setErrors({ ...errors, full_name: result.isValid ? '' : result.error! });
                  }}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.full_name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Ahmet Yılmaz"
                  required
                />
                {errors.full_name && (
                  <p className="text-xs text-red-600 mt-1">{errors.full_name}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  E-posta
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (errors.email) setErrors({ ...errors, email: '' });
                  }}
                  onBlur={(e) => {
                    if (e.target.value.trim()) {
                      const result = validateEmail(e.target.value);
                      setErrors({ ...errors, email: result.isValid ? '' : result.error! });
                    }
                  }}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="ahmet@example.com"
                />
                {errors.email && (
                  <p className="text-xs text-red-600 mt-1">{errors.email}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Telefon
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    setFormData({ ...formData, phone: formatted });
                    if (errors.phone) setErrors({ ...errors, phone: '' });
                  }}
                  onBlur={(e) => {
                    if (e.target.value.trim()) {
                      const result = validatePhone(e.target.value);
                      setErrors({ ...errors, phone: result.isValid ? '' : result.error! });
                    }
                  }}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.phone ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="05XX XXX XX XX"
                  maxLength={15}
                />
                {errors.phone && (
                  <p className="text-xs text-red-600 mt-1">{errors.phone}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Refakatçi Sayısı
                </label>
                <input
                  type="number"
                  value={formData.companion_count}
                  onChange={(e) => setFormData({ ...formData, companion_count: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  min="0"
                  max="10"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Notlar (Sadece siz görür)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                rows={2}
                placeholder="VIP masaya oturacak..."
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button type="submit" className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors">
                <Check className="h-4 w-4" />
                {editingGuestId ? 'Güncelle' : 'Ekle'}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                İptal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Guest List - Minimal Cards */}
      <div className="space-y-2">
        {guests.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <UserPlus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-700 mb-1">Henüz davetli yok</p>
            <p className="text-xs text-gray-500">Yeni davetli eklemek için butona tıklayın</p>
          </div>
        ) : (
          guests.map((guest) => (
            <div
              key={guest.id}
              className="bg-white rounded-lg border border-gray-200 p-3 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <h4 className="text-sm font-semibold text-gray-900">{guest.full_name}</h4>
                    {getRSVPBadge(guest.rsvp_status)}
                    {guest.companion_count > 0 && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                        +{guest.companion_count}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-1 text-xs text-gray-600">
                    {guest.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{guest.email}</span>
                      </div>
                    )}
                    {guest.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3 flex-shrink-0" />
                        <span>{guest.phone}</span>
                      </div>
                    )}
                    
                    {/* RSVP Response Details */}
                    {guest.rsvp_status !== 'pending' && guest.rsvp_responded_at && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        {guest.dietary_restrictions && (
                          <div className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded mb-1">
                            Diyet: {guest.dietary_restrictions}
                          </div>
                        )}
                        {guest.notes && (
                          <div className="text-xs text-gray-600 bg-gray-50 px-2 py-0.5 rounded">
                            {guest.notes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={invitationStatus === 'published' ? () => guestService.copyRSVPLink(guest.guest_token) : undefined}
                    disabled={invitationStatus !== 'published'}
                    className={`p-1.5 rounded transition-colors ${
                      invitationStatus === 'published'
                        ? 'text-blue-600 hover:bg-blue-50'
                        : 'text-gray-300 cursor-not-allowed'
                    }`}
                    title={invitationStatus === 'published' ? 'RSVP linkini kopyala' : 'Yayınlamadan RSVP linki paylaşılamaz'}
                  >
                    <Link2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEditClick(guest)}
                    className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    title="Düzenle"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(guest)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Sil"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setGuestToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Davetliyi Sil"
        message={`"${guestToDelete?.name}" isimli davetliyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
        confirmText="Evet, Sil"
        cancelText="İptal"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default GuestList;

