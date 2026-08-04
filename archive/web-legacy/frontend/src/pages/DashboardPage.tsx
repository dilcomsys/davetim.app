import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { analyticsService } from '../services/analyticsService';
import { Plus, Calendar, Edit, Trash2, Eye, Crown, Zap, Users, CheckCircle, TrendingUp, Lock, Sparkles, BarChart3, ExternalLink, Award, Rocket, Gift } from 'lucide-react';
import { invitationService, type Invitation } from '../services/invitationService';
import { guestService, type GuestStats } from '../services/guestService';
import { useAuth } from '../store/authStore';
import { useSubscription } from '../hooks/useSubscription';
import { DashboardSkeleton } from '../components/Skeleton/Skeleton';
import ConfirmDialog from '../components/Common/ConfirmDialog';
import { StatsCard } from '../components/Dashboard/StatsCard';
import { RSVPChart } from '../components/Dashboard/RSVPChart';
import { ViewsTimeline } from '../components/Dashboard/ViewsTimeline';
import { RecentActivity, Activity } from '../components/Dashboard/RecentActivity';
import { TopTemplates, TemplateUsage } from '../components/Dashboard/TopTemplates';
import { ExportAnalytics } from '../components/Dashboard/ExportAnalytics';
import toast from 'react-hot-toast';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const subscription = useSubscription();

  // State
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [guestStats, setGuestStats] = useState<Record<string, GuestStats>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Confirm dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [invitationToDelete, setInvitationToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Analytics data
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [topTemplates, setTopTemplates] = useState<TemplateUsage[]>([]);
  const [viewsData, setViewsData] = useState<any[]>([]);

  // Load invitations
  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    setIsLoading(true);
    try {
      const data = await invitationService.getUserInvitations();
      setInvitations(data);

      // Load guest stats for each invitation
      const statsPromises = data.map(async (invitation) => {
        const stats = await guestService.getGuestStats(invitation.id);
        return { invitationId: invitation.id, stats };
      });

      const statsResults = await Promise.all(statsPromises);
      const statsMap: Record<string, GuestStats> = {};
      statsResults.forEach(({ invitationId, stats }) => {
        statsMap[invitationId] = stats;
      });
      setGuestStats(statsMap);

      // Generate analytics data
      generateAnalyticsData(data, statsMap);
    } catch (error) {
      console.error('Error loading invitations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAnalyticsData = (invitations: Invitation[], statsMap: Record<string, GuestStats>) => {
    // Generate recent activities
    const activities: Activity[] = [];

    invitations.slice(0, 10).forEach((inv) => {
      const stats = statsMap[inv.id];

      // Add invitation created activity
      activities.push({
        id: `${inv.id} -created`,
        type: 'invitation_created',
        title: 'Yeni davetiye oluşturuldu',
        description: inv.title,
        timestamp: inv.created_at,
        invitationTitle: inv.title,
      });

      // Add RSVP activities if any
      if (stats && stats.total_attending > 0) {
        activities.push({
          id: `${inv.id} -rsvp - yes`,
          type: 'rsvp_yes',
          title: 'Yeni RSVP yanıtı',
          description: `${stats.total_attending} kişi katılacak`,
          timestamp: inv.updated_at || inv.created_at,
          invitationTitle: inv.title,
        });
      }

      // Add view activity if has views
      if (inv.view_count > 0) {
        activities.push({
          id: `${inv.id} -views`,
          type: 'view',
          title: 'Davetiye görüntülendi',
          description: `${inv.view_count} görüntülenme`,
          timestamp: inv.updated_at || inv.created_at,
          invitationTitle: inv.title,
        });
      }
    });

    // Sort by timestamp descending
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setRecentActivities(activities.slice(0, 10));

    // Generate top templates data
    const templateUsage: Record<string, TemplateUsage> = {};

    invitations.forEach((inv) => {
      if (inv.template) {
        const templateId = inv.template_id;
        if (!templateUsage[templateId]) {
          templateUsage[templateId] = {
            templateId: templateId,
            templateName: inv.template.name,
            previewImage: inv.template.preview_image_url,
            usageCount: 0,
            averageViews: 0,
            tier: inv.template.tier || 'free',
          };
        }
        templateUsage[templateId].usageCount++;
        templateUsage[templateId].averageViews += inv.view_count;
      }
    });

    // Calculate averages and sort by usage
    const topTemplatesList = Object.values(templateUsage)
      .map((t) => ({
        ...t,
        averageViews: Math.round(t.averageViews / t.usageCount),
      }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5);

    setTopTemplates(topTemplatesList);

    // Generate REAL views timeline (last 7 days) - NO MOCK DATA
    const viewsTimeline = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Calculate actual views for this date from invitations
      // In production, this should come from a daily_views table
      // For now, we'll show 0 for all days (real data)
      let dayViews = 0;

      // Count views from invitations created on this day
      invitations.forEach(inv => {
        const invDate = new Date(inv.created_at).toISOString().split('T')[0];
        if (invDate === dateStr) {
          dayViews += inv.view_count;
        }
      });

      viewsTimeline.push({
        date: dateStr,
        views: dayViews,
      });
    }

    setViewsData(viewsTimeline);
  };

  // User stats - with safe calculations
  const totalGuests = Object.values(guestStats).reduce((sum, stats) => sum + (stats?.total || 0), 0);
  const totalAttending = Object.values(guestStats).reduce((sum, stats) => sum + (stats?.total_attending || 0), 0);
  const totalNotAttending = Object.values(guestStats).reduce((sum, stats) => sum + (stats?.declined || 0), 0);
  const totalPending = Object.values(guestStats).reduce((sum, stats) => sum + (stats?.pending || 0), 0);

  const userStats = {
    totalInvitations: invitations.length,
    draftInvitations: invitations.filter(i => i.status === 'draft').length,
    publishedInvitations: invitations.filter(i => i.status === 'published').length,
    totalViews: invitations.reduce((sum, i) => sum + (i.view_count || 0), 0),
    totalGuests,
    totalAttending,
    totalNotAttending,
    totalPending,
  };

  const handleCreateNew = async () => {
    // Check if user can create invitation
    const { allowed, reason } = await subscription.canCreateInvitation();

    if (!allowed) {
      toast.error(reason || 'Davetiye oluşturma limitine ulaştınız');
      navigate('/pricing');
      return;
    }

    // Track create action start
    analyticsService.trackInvitationAction('create');

    navigate('/templates');
  };

  const handleEditInvitation = (id: string) => {
    analyticsService.trackInvitationAction('edit', id);
    navigate(`/editor/${id}`);
  };

  const handleViewInvitation = (id: string) => {
    analyticsService.trackInvitationAction('publish', id);
    navigate(`/i/${id}`);
  };

  const handleDeleteClick = (invitation: Invitation) => {
    setInvitationToDelete({ id: invitation.id, title: invitation.title });
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!invitationToDelete) return;

    setIsDeleting(true);
    try {
      const success = await invitationService.deleteInvitation(invitationToDelete.id);
      if (success) {
        analyticsService.trackInvitationAction('delete', invitationToDelete.id);
        // Reload invitations
        await loadInvitations();
        setShowDeleteDialog(false);
        setInvitationToDelete(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold bg-gradient-to-r from-green-100 to-green-200 text-green-800 rounded-full whitespace-nowrap">✓ Yayında</span>;
      case 'draft':
        return <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 rounded-full whitespace-nowrap">📝 Taslak</span>;
      case 'archived':
        return <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 rounded-full whitespace-nowrap">🗄️ Arşiv</span>;
      default:
        return <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold bg-gray-100 text-gray-800 rounded-full whitespace-nowrap">Bilinmiyor</span>;
    }
  };

  // Remaining invitations helper
  const getRemainingInvitationsDisplay = () => {
    const remaining = subscription.getRemainingInvitations();

    if (remaining === 'unlimited') {
      return (
        <span className="text-primary-700 font-semibold flex items-center gap-1">
          <Sparkles className="h-3.5 w-3.5" />
          Sınırsız
        </span>
      );
    }

    if (remaining === 0) {
      return (
        <span className="text-red-600 font-semibold flex items-center gap-1">
          <Lock className="h-3.5 w-3.5" />
          Limit Doldu
        </span>
      );
    }

    return (
      <span className="text-primary-700 font-semibold">
        {remaining} Kalan
      </span>
    );
  };

  // Show skeleton while loading
  if (isLoading || subscription.isLoading) {
    return <DashboardSkeleton />;
  }

  // Can create invitation check
  const canCreateNewInvitation = subscription.getRemainingInvitations() !== 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-6 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - Compact */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Hoş geldiniz, {authUser?.fullName?.split(' ')[0] || 'Kullanıcı'}! 👋
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Davetiyelerinizi yönetin ve yenilerini oluşturun
              </p>
            </div>
            {canCreateNewInvitation && (
              <button
                onClick={handleCreateNew}
                className="hidden sm:flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 text-sm"
              >
                <Plus className="h-4 w-4" />
                Yeni Davetiye
              </button>
            )}
          </div>
        </div>

        {/* Invitation Limit Warning - Compact */}
        {!canCreateNewInvitation && (
          <div className="mb-6 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Lock className="h-5 w-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-orange-900 mb-1 text-sm">Davetiye Limitiniz Doldu</h3>
                <p className="text-xs text-orange-700 mb-2">
                  Daha fazla davetiye oluşturmak için planınızı yükseltin
                </p>
                <Link
                  to="/pricing"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-700 hover:text-orange-800 px-3 py-1.5 bg-white rounded-lg hover:shadow-sm transition-all"
                >
                  Premium'a Geç
                  <TrendingUp className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards - Compact */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
          <StatsCard
            title="Davetiye"
            value={userStats.totalInvitations}
            subtitle={`${userStats.publishedInvitations} yayında`}
            icon={Calendar}
            iconColor="primary"
          />

          <StatsCard
            title="Görüntüleme"
            value={userStats.totalViews}
            icon={Eye}
            iconColor="blue"
          />

          <StatsCard
            title="Davetli"
            value={userStats.totalGuests}
            subtitle="Toplam"
            icon={Users}
            iconColor="purple"
          />

          <StatsCard
            title="Katılacak"
            value={userStats.totalAttending}
            subtitle="Onaylı"
            icon={CheckCircle}
            iconColor="green"
          />

          {/* Active Plan Card - Compact */}
          <div className="col-span-2 md:col-span-1 bg-gradient-to-br from-primary-50 via-primary-100 to-blue-100 rounded-xl shadow-sm p-4 border border-primary-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex-1">
                <p className="text-xs font-semibold text-primary-900 mb-0.5">Aktif Plan</p>
                <p className="text-lg font-bold text-primary-900">
                  {subscription.planName}
                </p>
                <div className="text-xs text-primary-700 mt-1">
                  {getRemainingInvitationsDisplay()}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary-200 to-primary-300">
                {subscription.currentPlan === 'premium' ? (
                  <Crown className="h-5 w-5 text-primary-700" />
                ) : subscription.currentPlan === 'pro' ? (
                  <Zap className="h-5 w-5 text-primary-700" />
                ) : (
                  <Sparkles className="h-5 w-5 text-primary-700" />
                )}
              </div>
            </div>
            {subscription.isFreePlan && (
              <Link
                to="/pricing"
                className="text-xs text-primary-700 hover:text-primary-800 font-bold flex items-center gap-1 group mt-2"
              >
                Yükselt
                <TrendingUp className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )}
          </div>
        </div>

        {/* Action Bar - Compact */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">
            Davetiyelerim
          </h2>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {!canCreateNewInvitation ? (
              <button
                onClick={() => navigate('/pricing')}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-orange-50 text-orange-700 font-semibold rounded-xl border border-orange-300 hover:border-orange-400 transition-all text-sm"
              >
                <Lock className="h-4 w-4" />
                Limit Doldu - Yükselt
              </button>
            ) : (
              <button
                onClick={handleCreateNew}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 text-sm"
              >
                <Plus className="h-4 w-4" />
                <span className="sm:hidden">Yeni</span>
                <span className="hidden sm:inline">Yeni Davetiye</span>
              </button>
            )}
          </div>
        </div>

        {/* Invitations List - Mobile Optimized */}
        {invitations.length > 0 && (
          <div className="bg-white shadow-md rounded-2xl overflow-hidden border border-gray-200 animate-fade-in mb-6">
            <div className="divide-y divide-gray-100">
              {invitations.map((invitation, index) => (
                <div
                  key={invitation.id}
                  className="p-3 sm:p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  style={{ animationDelay: `${index * 30} ms` }}
                  onClick={() => handleEditInvitation(invitation.id)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Title and Status - Mobile Optimized */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                        <h4 className="text-sm sm:text-base font-bold text-gray-900 truncate">
                          {invitation.title}
                        </h4>
                        <div className="flex-shrink-0">
                          {getStatusBadge(invitation.status)}
                        </div>
                      </div>

                      {/* Details Row - More Compact on Mobile */}
                      <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3 gap-y-1 text-[11px] sm:text-xs text-gray-600 mb-2">
                        <span className="flex items-center gap-0.5 sm:gap-1">
                          <span className="text-[10px] sm:text-xs">📋</span>
                          <span className="truncate max-w-[120px] sm:max-w-none">{invitation.template?.name || 'Bilinmiyor'}</span>
                        </span>
                        {invitation.event_date && (
                          <span className="flex items-center gap-0.5 sm:gap-1">
                            <span className="text-[10px] sm:text-xs">📅</span>
                            <span>{new Date(invitation.event_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</span>
                          </span>
                        )}
                        <span className="flex items-center gap-0.5 sm:gap-1">
                          <span className="text-[10px] sm:text-xs">👁️</span>
                          <span>{invitation.view_count}</span>
                        </span>
                      </div>

                      {/* Guest Stats - More Compact on Mobile */}
                      {guestStats[invitation.id] && guestStats[invitation.id].total > 0 && (
                        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                          <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                            👥 {guestStats[invitation.id].total}
                          </span>
                          {guestStats[invitation.id].attending > 0 && (
                            <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full bg-green-100 text-green-700">
                              ✓ {guestStats[invitation.id].attending}
                            </span>
                          )}
                          {guestStats[invitation.id].pending > 0 && (
                            <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full bg-yellow-100 text-yellow-700">
                              ⏳ {guestStats[invitation.id].pending}
                            </span>
                          )}
                          {guestStats[invitation.id].total_attending > guestStats[invitation.id].attending && (
                            <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-semibold rounded-full bg-purple-100 text-purple-700">
                              🎉 {guestStats[invitation.id].total_attending}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons - Mobile Optimized */}
                    <div className="flex items-center gap-0.5 sm:gap-1 self-start sm:self-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleEditInvitation(invitation.id)}
                        className="p-1.5 sm:p-2 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-all touch-target"
                        title="Düzenle"
                      >
                        <Edit className="h-4 w-4 sm:h-4 sm:w-4" />
                      </button>
                      <button
                        onClick={() => handleViewInvitation(invitation.id)}
                        className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-all touch-target"
                        title="Görüntüle"
                      >
                        <ExternalLink className="h-4 w-4 sm:h-4 sm:w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(invitation)}
                        className="p-1.5 sm:p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-all touch-target"
                        title="Sil"
                      >
                        <Trash2 className="h-4 w-4 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Grids - Show based on plan */}
        {!subscription.isFreePlan && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
              {/* RSVP Chart */}
              <RSVPChart
                attending={userStats.totalAttending}
                notAttending={userStats.totalNotAttending}
                pending={userStats.totalPending}
              />

              {/* Views Timeline */}
              <ViewsTimeline
                data={viewsData}
                totalViews={userStats.totalViews}
              />
            </div>

            {/* Second Row Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
              {/* Recent Activity */}
              <RecentActivity activities={recentActivities} />

              {/* Top Templates */}
              <TopTemplates templates={topTemplates} />
            </div>

            {/* Export Analytics - Premium Only */}
            {subscription.isPremiumPlan && (
              <div className="mb-6">
                <ExportAnalytics
                  data={{
                    invitations: invitations,
                    guestStats: guestStats,
                    activities: recentActivities,
                  }}
                />
              </div>
            )}
          </>
        )}

        {/* Free Plan Upgrade CTA */}
        {subscription.isFreePlan && invitations.length > 0 && (
          <div className="mb-6 bg-gradient-to-br from-primary-50 via-blue-50 to-purple-50 rounded-2xl p-6 border border-primary-200/50 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-gradient-to-br from-primary-200 to-primary-300 rounded-xl">
                <BarChart3 className="h-6 w-6 text-primary-700" />
              </div>
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/80 backdrop-blur-sm rounded-full mb-2">
                  <Sparkles className="h-3 w-3 text-primary-600" />
                  <span className="text-xs font-bold text-gray-700">Premium Özellik</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  Gelişmiş Analitik ve Raporlama
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  RSVP grafikleri, görüntüleme zaman çizelgesi, aktivite takibi ve Excel export özellikleriyle davetiyelerinizi detaylı analiz edin
                </p>
                <Link
                  to="/pricing"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105 text-sm"
                >
                  Premium'a Yükselt
                  <TrendingUp className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Empty State - Compact */}
        {invitations.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-primary-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-7 w-7 text-primary-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Henüz Davetiyeniz Yok
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                İlk davetiyenizi oluşturarak başlayın ve sevdiklerinizi özel etkinliğinize davet edin
              </p>
              {canCreateNewInvitation ? (
                <button
                  onClick={handleCreateNew}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  İlk Davetiyemi Oluştur
                </button>
              ) : (
                <Link
                  to="/pricing"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105 text-sm"
                >
                  <Crown className="h-4 w-4" />
                  Premium'a Geç
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Premium Features Showcase - Only for Premium Users with Invitations */}
        {subscription.isPremiumPlan && invitations.length > 0 && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* QR Media Feature */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200/50">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-gradient-to-br from-purple-200 to-pink-200 rounded-lg">
                  <Gift className="h-5 w-5 text-purple-700" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-900 mb-1">
                    QR Medya Yükleme
                  </h3>
                  <p className="text-xs text-gray-600">
                    Davetlileriniz QR kod ile fotoğraf ve video paylaşabilir
                  </p>
                </div>
              </div>
              <Link
                to="/qr-manage"
                className="inline-flex items-center gap-1.5 text-xs text-purple-700 hover:text-purple-800 font-bold group"
              >
                QR Medya Yönet
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </Link>
            </div>

            {/* AI Design Feature */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border border-blue-200/50">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-gradient-to-br from-blue-200 to-cyan-200 rounded-lg">
                  <Rocket className="h-5 w-5 text-blue-700" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-900 mb-1">
                    AI Tasarım Önerileri
                  </h3>
                  <p className="text-xs text-gray-600">
                    Yapay zeka destekli tasarım önerileri alın
                  </p>
                </div>
              </div>
              <Link
                to="/templates?filter=premium"
                className="inline-flex items-center gap-1.5 text-xs text-blue-700 hover:text-blue-800 font-bold group"
              >
                Premium Şablonlar
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </Link>
            </div>

            {/* Priority Support */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200/50">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-gradient-to-br from-green-200 to-emerald-200 rounded-lg">
                  <Award className="h-5 w-5 text-green-700" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-900 mb-1">
                    Öncelikli Destek
                  </h3>
                  <p className="text-xs text-gray-600">
                    7/24 öncelikli destek hattımızdan yararlanın
                  </p>
                </div>
              </div>
              <Link
                to="/contact"
                className="inline-flex items-center gap-1.5 text-xs text-green-700 hover:text-green-800 font-bold group"
              >
                Destek Talebi
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </Link>
            </div>
          </div>
        )}

        {/* Quick Actions - Compact */}
        {invitations.length > 0 && !subscription.isPremiumPlan && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-xl p-5 border border-primary-200/50">
              <h3 className="text-base font-bold text-gray-900 mb-1.5">
                Hızlı Başlangıç
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Popüler şablonlarla hemen davetiye oluşturun
              </p>
              <Link
                to="/templates"
                className="inline-flex items-center gap-1.5 text-sm text-primary-700 hover:text-primary-800 font-bold group"
              >
                Şablonları İncele
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </Link>
            </div>

            {subscription.isFreePlan && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200/50">
                <h3 className="text-base font-bold text-gray-900 mb-1.5">
                  Premium'a Geçin
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Sınırsız davetiye ve özel şablonlar
                </p>
                <Link
                  to="/pricing"
                  className="inline-flex items-center gap-1.5 text-sm text-green-700 hover:text-green-800 font-bold group"
                >
                  Planları Karşılaştır
                  <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                </Link>
              </div>
            )}

            {subscription.currentPlan === 'pro' && (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200/50">
                <h3 className="text-base font-bold text-gray-900 mb-1.5">
                  Premium'a Yükselt
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  QR medya, AI tasarım ve sınırsız davetiye
                </p>
                <Link
                  to="/pricing"
                  className="inline-flex items-center gap-1.5 text-sm text-purple-700 hover:text-purple-800 font-bold group"
                >
                  Premium Özellikleri Gör
                  <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => {
          setShowDeleteDialog(false);
          setInvitationToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Davetiyeyi Sil"
        message={`"${invitationToDelete?.title}" davetiyesini silmek istediğinize emin misiniz ? Bu işlem geri alınamaz ve tüm misafir bilgileri de silinecektir.`}
        confirmText="Evet, Sil"
        cancelText="İptal"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default DashboardPage;
