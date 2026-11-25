import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Modal,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/ThemeProvider';
import Chip from '../../src/components/Chip';
import NoticeCard from '../../src/components/NoticeCard';
import { SkeletonCard } from '../../src/components/Skeleton';
import EmptyState from '../../src/components/EmptyState';
import ErrorCard from '../../src/components/ErrorCard';
import PrimaryButton from '../../src/components/PrimaryButton';
import { getCurrentUserProfile } from '../../src/services/authService';
import {
  fetchBuyerFeed,
  subscribeToBuyerFeed,
  fetchBuyerReadStatus,
  markNoticeAsRead,
} from '../../src/services/noticeService';

export default function UpdatesScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();

  const [userProfile, setUserProfile] = useState(null);
  const [filter, setFilter] = useState('all');
  const [notices, setNotices] = useState([]);
  const [readMap, setReadMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  const [activeNotice, setActiveNotice] = useState(null);

  const lastDocRef = useRef(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    getCurrentUserProfile().then((prof) => {
      setUserProfile(prof);
    });
  }, []);

  const loadFeed = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setLoading(true);
          lastDocRef.current = null;
        }
        setError(null);

        const result = await fetchBuyerFeed({
          pid: userProfile?.pid,
          tower: userProfile?.tower || 'A',
          unit: userProfile?.unit || '1204',
          filter,
          lastDoc: null,
          pageSize: 15,
        });

        setNotices(result.notices);
        lastDocRef.current = result.lastDoc;
        setHasMore(result.hasMore);

        if (userProfile?.uid && result.notices?.length > 0) {
          fetchBuyerReadStatus({
            pid: userProfile.pid,
            noticeIds: result.notices.map((n) => n.id),
            uid: userProfile.uid,
          }).then((reads) => {
            setReadMap((prev) => ({ ...prev, ...reads }));
          }).catch(() => {});
        }
      } catch (err) {
        console.warn('Error loading updates feed:', err);
      } finally {
        setLoading(false);
      }
    },
    [userProfile, filter]
  );

  useEffect(() => {
    if (!userProfile) return;

    loadFeed(true);

    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    try {
      unsubscribeRef.current = subscribeToBuyerFeed({
        pid: userProfile.pid,
        tower: userProfile.tower || 'A',
        unit: userProfile.unit || '1204',
        filter,
        onUpdate: (liveNotices) => {
          setNotices(liveNotices);
          if (userProfile.uid && liveNotices.length > 0) {
            fetchBuyerReadStatus({
              pid: userProfile.pid,
              noticeIds: liveNotices.map((n) => n.id),
              uid: userProfile.uid,
            }).then((reads) => {
              setReadMap((prev) => ({ ...prev, ...reads }));
            });
          }
        },
        onError: (err) => {
          console.warn('Subscription error:', err);
        },
      });
    } catch (e) {
      console.warn('Could not subscribe live feed:', e);
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [userProfile, filter, loadFeed]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore || !lastDocRef.current || !userProfile) return;
    setLoadingMore(true);

    try {
      const result = await fetchBuyerFeed({
        pid: userProfile.pid,
        tower: userProfile.tower || 'A',
        unit: userProfile.unit || '1204',
        filter,
        lastDoc: lastDocRef.current,
        pageSize: 15,
      });

      lastDocRef.current = result.lastDoc;
      setHasMore(result.hasMore);

      if (result.notices.length > 0) {
        setNotices((prev) => [...prev, ...result.notices]);

        if (userProfile.uid) {
          const reads = await fetchBuyerReadStatus({
            pid: userProfile.pid,
            noticeIds: result.notices.map((n) => n.id),
            uid: userProfile.uid,
          });
          setReadMap((prev) => ({ ...prev, ...reads }));
        }
      }
    } catch (err) {
      console.warn('Error fetching more notices:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleOpenNotice = async (notice) => {
    setActiveNotice(notice);
    if (userProfile?.uid && notice?.id) {
      await markNoticeAsRead({
        pid: userProfile.pid,
        nid: notice.id,
        uid: userProfile.uid,
      });
      setReadMap((prev) => ({ ...prev, [notice.id]: true }));
    }
  };

  const unreadCount = notices.filter((n) => !readMap[n.id]).length;
  const tower = userProfile?.tower || 'A';
  const unit = userProfile?.unit || '1204';

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.screenTitle,
              {
                color: theme.colors.text,
                fontFamily: theme.typography.headingFont,
                fontSize: theme.typography.titleSize + 4,
              },
            ]}
          >
            Updates Feed
          </Text>
          {unreadCount > 0 && (
            <View
              style={[
                styles.unreadBadge,
                {
                  backgroundColor: theme.colors.unreadDot,
                  borderRadius: theme.shape.smallRadius,
                },
              ]}
              accessibilityLabel={`${unreadCount} unread notices`}
            >
              <Text
                style={[
                  styles.unreadBadgeText,
                  {
                    color: theme.colors.onPrimary,
                    fontFamily: theme.typography.headingFont,
                    fontSize: theme.typography.smallSize,
                  },
                ]}
              >
                {unreadCount} unread
              </Text>
            </View>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          <Chip
            label="All Notices"
            selected={filter === 'all'}
            onPress={() => setFilter('all')}
          />
          <Chip
            label={`Tower ${tower}`}
            selected={filter === 'tower'}
            onPress={() => setFilter('tower')}
          />
          <Chip
            label={`Unit ${tower}-${unit}`}
            selected={filter === 'unit'}
            onPress={() => setFilter('unit')}
          />
        </ScrollView>
      </View>

      {error ? (
        <View style={styles.centerContainer}>
          <ErrorCard message={error} onRetry={() => loadFeed(true)} />
        </View>
      ) : loading ? (
        <View style={styles.loadingList}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={notices}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NoticeCard
              notice={item}
              isRead={Boolean(readMap[item.id])}
              onPress={() => handleOpenNotice(item)}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: isDark ? 80 : 110 },
          ]}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <EmptyState
              title="No updates found"
              message={`There are no notices published for ${filter === 'tower' ? `Tower ${tower}` : filter === 'unit' ? `Unit ${tower}-${unit}` : 'your unit'} at this time.`}
            />
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
              </View>
            ) : null
          }
        />
      )}

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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  screenTitle: {
    letterSpacing: -0.5,
  },
  unreadBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  unreadBadgeText: {
    fontWeight: '700',
  },
  filterScroll: {
    paddingVertical: 4,
    gap: 8,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  loadingList: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  centerContainer: {
    padding: 20,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
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
});