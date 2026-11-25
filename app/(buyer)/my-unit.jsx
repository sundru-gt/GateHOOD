import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/ThemeProvider';
import GreetingHeader from '../../src/components/GreetingHeader';
import HeroUnitCard from '../../src/components/HeroUnitCard';
import StatTile from '../../src/components/StatTile';
import NoticeCard from '../../src/components/NoticeCard';
import PrimaryButton from '../../src/components/PrimaryButton';
import Skeleton, { SkeletonCard } from '../../src/components/Skeleton';
import ErrorCard from '../../src/components/ErrorCard';
import { getCurrentUserProfile, loginAsBuilder, logoutUser } from '../../src/services/authService';
import {
  fetchProjectDetails,
  fetchBuyerUnitDetails,
  calculateDaysToPossession,
} from '../../src/services/unitService';
import {
  fetchBuyerFeed,
  markNoticeAsRead,
  fetchBuyerReadStatus,
} from '../../src/services/noticeService';

export default function MyUnitScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, isDark, toggleTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [userProfile, setUserProfile] = useState(null);
  const [unitData, setUnitData] = useState(null);
  const [projectData, setProjectData] = useState(null);
  const [latestPinnedNotice, setLatestPinnedNotice] = useState(null);
  const [isLatestNoticeRead, setIsLatestNoticeRead] = useState(false);

  const [activeNotice, setActiveNotice] = useState(null);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [builderPinInput, setBuilderPinInput] = useState('');
  const [builderPinError, setBuilderPinError] = useState('');

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const profile = await getCurrentUserProfile();
      setUserProfile(profile);

      const [proj, unit] = await Promise.all([
        fetchProjectDetails(profile?.pid).catch(() => null),
        profile?.unitId ? fetchBuyerUnitDetails(profile.pid, profile.unitId).catch(() => null) : null,
      ]);

      setProjectData(proj || { name: 'Gatehood Sky Residences', progressPct: 74, possessionDate: new Date(Date.now() + 142 * 86400000) });
      setUnitData(unit || { tower: profile?.tower || 'A', unit: profile?.unit || '1204', config: '3BHK', buyerName: 'Resident ' + (profile?.unitId || 'A-1204') });

      let feedResult;
      try {
        feedResult = await fetchBuyerFeed({
          pid: profile?.pid,
          tower: profile?.tower || 'A',
          unit: profile?.unit || '1204',
          filter: 'all',
        });
      } catch {
        feedResult = { notices: [] };
      }

      const pinned = feedResult.notices?.find((n) => n.pinned) || feedResult.notices?.[0];
      setLatestPinnedNotice(pinned || null);

      if (pinned && profile?.uid) {
        try {
          const readMap = await fetchBuyerReadStatus({
            pid: profile?.pid,
            noticeIds: [pinned.id],
            uid: profile.uid,
          });
          setIsLatestNoticeRead(Boolean(readMap[pinned.id]));
        } catch {
        }
      }
    } catch (err) {
      console.warn('Error loading My Unit data:', err);
      setProjectData({ name: 'Gatehood Sky Residences', progressPct: 74, possessionDate: new Date(Date.now() + 142 * 86400000) });
      setUnitData({ tower: 'A', unit: '1204', config: '3BHK', buyerName: 'Resident A-1204' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleOpenNotice = async (notice) => {
    setActiveNotice(notice);
    if (userProfile?.uid && notice?.id) {
      await markNoticeAsRead({
        pid: userProfile.pid,
        nid: notice.id,
        uid: userProfile.uid,
      });
      setIsLatestNoticeRead(true);
    }
  };

  const handleSwitchToBuilder = async () => {
    try {
      setBuilderPinError('');
      await loginAsBuilder(builderPinInput);
      setSettingsVisible(false);
      router.replace('/residents');
    } catch (err) {
      setBuilderPinError(err.message || 'Invalid PIN');
    }
  };

  const daysToPossession = calculateDaysToPossession(projectData?.possessionDate);
  const tower = userProfile?.tower || unitData?.tower || 'A';
  const unitNumber = userProfile?.unit || unitData?.unit || '1204';
  const config = unitData?.config || '3BHK';
  const buyerName = unitData?.buyerName || 'Resident';
  const progressPct = projectData?.progressPct || 74;

  let floorNumber = '12';
  if (unitNumber && unitNumber.length >= 3) {
    floorNumber = unitNumber.slice(0, unitNumber.length - 2);
  }

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.bg, paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: isDark ? 80 : 110 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        <GreetingHeader
          greeting="Welcome home"
          name={buyerName}
          onAvatarPress={() => setSettingsVisible(true)}
        />

        {error ? (
          <ErrorCard message={error} onRetry={loadData} />
        ) : loading ? (
          <View style={styles.skeletonContainer}>
            <Skeleton width="100%" height={160} borderRadius={theme.shape.heroRadius} style={{ marginVertical: 12 }} />
            <View style={styles.statsRow}>
              <Skeleton width="48%" height={84} borderRadius={theme.shape.smallRadius} />
              <Skeleton width="48%" height={84} borderRadius={theme.shape.smallRadius} />
            </View>
            <SkeletonCard />
          </View>
        ) : (
          <>
            <HeroUnitCard
              unitNumber={unitNumber}
              tower={`Tower ${tower}`}
              config={config}
              progressPct={progressPct}
              daysToPossession={daysToPossession}
            />

            <View style={styles.statsRow}>
              <StatTile
                label="Possession In"
                value={`${daysToPossession}d`}
                subtitle="Expected Dec 2026"
                highlight={true}
                style={styles.halfTile}
              />
              <StatTile
                label="Floor & Config"
                value={`Fl ${floorNumber}`}
                subtitle={`${config} Apartment`}
                style={styles.halfTile}
              />
            </View>

            <View style={styles.sectionHeader}>
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: theme.colors.text,
                    fontFamily: theme.typography.headingFont,
                    fontSize: theme.typography.titleSize - 3,
                  },
                ]}
              >
                Latest Update
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push('/updates')}
                accessibilityRole="button"
                accessibilityLabel="See all updates"
              >
                <Text
                  style={[
                    styles.seeAllText,
                    {
                      color: theme.colors.primary,
                      fontFamily: theme.typography.headingFont,
                      fontSize: theme.typography.smallSize + 2,
                    },
                  ]}
                >
                  See all →
                </Text>
              </TouchableOpacity>
            </View>

            {latestPinnedNotice ? (
              <NoticeCard
                notice={latestPinnedNotice}
                isRead={isLatestNoticeRead}
                onPress={() => handleOpenNotice(latestPinnedNotice)}
              />
            ) : (
              <View
                style={[
                  styles.noNoticeBox,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.line,
                    borderRadius: theme.shape.smallRadius,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.noNoticeText,
                    {
                      color: theme.colors.muted,
                      fontFamily: theme.typography.bodyFont,
                    },
                  ]}
                >
                  No active announcements for your unit right now.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {activeNotice && (
        <Modal
          visible={Boolean(activeNotice)}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setActiveNotice(null)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: theme.colors.card,
                  borderColor: theme.colors.line,
                  borderRadius: theme.shape.cardRadius,
                },
              ]}
            >
              <View style={styles.modalHeader}>
                {activeNotice.pinned && (
                  <View
                    style={[
                      styles.pinnedBadge,
                      {
                        backgroundColor: theme.colors.pillPinnedBg,
                        borderRadius: theme.shape.smallRadius,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pinnedText,
                        {
                          color: theme.colors.pillPinnedText,
                          fontFamily: theme.typography.bodyBold,
                          fontSize: theme.typography.smallSize,
                        },
                      ]}
                    >
                      PINNED
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  onPress={() => setActiveNotice(null)}
                  style={styles.closeButton}
                  accessibilityLabel="Close notice"
                >
                  <Text style={[styles.closeIcon, { color: theme.colors.text }]}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text
                style={[
                  styles.modalTitle,
                  {
                    color: theme.colors.text,
                    fontFamily: theme.typography.headingFont,
                    fontSize: 20,
                  },
                ]}
              >
                {activeNotice.title}
              </Text>

              <ScrollView style={styles.modalBodyScroll}>
                <Text
                  style={[
                    styles.modalBody,
                    {
                      color: theme.colors.text,
                      fontFamily: theme.typography.bodyFont,
                      fontSize: theme.typography.baseSize,
                    },
                  ]}
                >
                  {activeNotice.body}
                </Text>
              </ScrollView>

              <PrimaryButton
                title="Marked as Read"
                onPress={() => setActiveNotice(null)}
                style={{ marginTop: 16 }}
              />
            </View>
          </View>
        </Modal>
      )}

      <Modal
        visible={settingsVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <View
            style={[
              styles.settingsCard,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.line,
                borderRadius: theme.shape.cardRadius,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text
                style={[
                  styles.settingsTitle,
                  {
                    color: theme.colors.text,
                    fontFamily: theme.typography.headingFont,
                    fontSize: 20,
                  },
                ]}
              >
                Preferences & Role
              </Text>
              <TouchableOpacity
                onPress={() => setSettingsVisible(false)}
                style={styles.closeButton}
                accessibilityLabel="Close settings"
              >
                <Text style={[styles.closeIcon, { color: theme.colors.text }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.settingRow}>
              <Text
                style={[
                  styles.settingLabel,
                  {
                    color: theme.colors.text,
                    fontFamily: theme.typography.bodyMedium,
                    fontSize: theme.typography.baseSize,
                  },
                ]}
              >
                Design Mode ({isDark ? 'Dark UI' : 'Light UI'})
              </Text>
              <TouchableOpacity
                onPress={toggleTheme}
                style={[
                  styles.toggleBtn,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.line,
                    borderRadius: theme.shape.smallRadius,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.toggleBtnText,
                    {
                      color: theme.colors.primary,
                      fontFamily: theme.typography.headingFont,
                      fontSize: theme.typography.smallSize + 1,
                    },
                  ]}
                >
                  Switch to {isDark ? 'Light' : 'Dark'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.builderSection}>
              <Text
                style={[
                  styles.builderHeading,
                  {
                    color: theme.colors.text,
                    fontFamily: theme.typography.headingFont,
                    fontSize: 16,
                  },
                ]}
              >
                Builder Access
              </Text>
              <Text
                style={[
                  styles.builderSub,
                  {
                    color: theme.colors.muted,
                    fontFamily: theme.typography.bodyFont,
                    fontSize: theme.typography.smallSize,
                  },
                ]}
              >
                Enter builder PIN to manage residents & notices.
              </Text>

              <TextInput
                value={builderPinInput}
                onChangeText={setBuilderPinInput}
                placeholder="Builder PIN (e.g. 4826)"
                placeholderTextColor={theme.colors.muted}
                secureTextEntry
                keyboardType="numeric"
                style={[
                  styles.pinInput,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: builderPinError ? theme.colors.error : theme.colors.line,
                    color: theme.colors.text,
                    borderRadius: theme.shape.smallRadius,
                    fontFamily: theme.typography.headingFont,
                  },
                ]}
              />
              {builderPinError ? (
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {builderPinError}
                </Text>
              ) : null}

              <PrimaryButton
                title="Enter Builder Mode"
                onPress={handleSwitchToBuilder}
                variant="primary"
                style={{ marginTop: 10 }}
              />
            </View>

            <View style={{ marginTop: 16 }}>
              <PrimaryButton
                title="Log Out / Reset"
                onPress={async () => {
                  await logoutUser();
                  setSettingsVisible(false);
                  router.replace('/join');
                }}
                variant="outline"
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  skeletonContainer: {
    paddingVertical: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginVertical: 10,
  },
  halfTile: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 8,
  },
  sectionTitle: {
    letterSpacing: -0.2,
  },
  seeAllText: {
    fontWeight: '700',
  },
  noNoticeBox: {
    padding: 20,
    borderWidth: 1,
    alignItems: 'center',
    marginVertical: 8,
  },
  noNoticeText: {
    fontSize: 14,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    padding: 22,
    borderWidth: 1,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pinnedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pinnedText: {
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: 6,
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalTitle: {
    marginBottom: 12,
    lineHeight: 26,
  },
  modalBodyScroll: {
    maxHeight: 260,
  },
  modalBody: {
    lineHeight: 24,
  },
  settingsCard: {
    width: '100%',
    maxWidth: 420,
    padding: 22,
    borderWidth: 1,
  },
  settingsTitle: {
    letterSpacing: -0.2,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.2)',
  },
  settingLabel: {},
  toggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  toggleBtnText: {
    fontWeight: '700',
  },
  builderSection: {
    marginTop: 18,
  },
  builderHeading: {
    marginBottom: 4,
  },
  builderSub: {
    marginBottom: 12,
  },
  pinInput: {
    height: 48,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
});