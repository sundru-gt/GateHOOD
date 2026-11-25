import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/ThemeProvider';
import ReadProgressCard from '../../src/components/ReadProgressCard';
import PrimaryButton from '../../src/components/PrimaryButton';
import { SkeletonCard } from '../../src/components/Skeleton';
import EmptyState from '../../src/components/EmptyState';
import ErrorCard from '../../src/components/ErrorCard';
import {
  fetchBuilderNotices,
  toggleNoticePin,
  fetchNotReadList,
} from '../../src/services/noticeService';

export default function BuilderNoticesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [notices, setNotices] = useState([]);

  const [notReadModalVisible, setNotReadModalVisible] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [notReadList, setNotReadList] = useState([]);
  const [loadingNotRead, setLoadingNotRead] = useState(false);

  const loadNotices = useCallback(async () => {
    try {
      setError(null);
      const list = await fetchBuilderNotices({});
      setNotices(list);
    } catch (err) {
      console.warn('Error fetching builder notices:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotices();
  }, [loadNotices]);

  const onRefresh = () => {
    setRefreshing(true);
    loadNotices();
  };

  const handleTogglePin = async (notice) => {
    try {
      const newPinned = await toggleNoticePin({
        nid: notice.id,
        currentPinned: notice.pinned,
      });
      setNotices((prev) =>
        prev.map((n) => (n.id === notice.id ? { ...n, pinned: newPinned } : n))
      );
    } catch (err) {
      console.warn('Error toggling pin:', err);
    }
  };

  const handleViewNotRead = async (notice) => {
    setSelectedNotice(notice);
    setNotReadModalVisible(true);
    setLoadingNotRead(true);
    try {
      const list = await fetchNotReadList({ notice });
      setNotReadList(list);
    } catch (err) {
      console.warn('Error fetching not read list:', err);
    } finally {
      setLoadingNotRead(false);
    }
  };

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
            Project Notices
          </Text>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/compose')}
            style={[
              styles.plusButton,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: theme.shape.cardRadius > 15 ? 22 : 8,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Compose new notice"
          >
            <Text style={[styles.plusIcon, { color: theme.colors.onPrimary }]}>+</Text>
          </TouchableOpacity>
        </View>

        <Text
          style={[
            styles.subtitle,
            {
              color: theme.colors.muted,
              fontFamily: theme.typography.bodyFont,
              fontSize: theme.typography.baseSize - 1,
            },
          ]}
        >
          Track read rates in real-time and pin critical updates
        </Text>
      </View>

      {error ? (
        <View style={styles.centerBox}>
          <ErrorCard message={error} onRetry={loadNotices} />
        </View>
      ) : loading ? (
        <View style={styles.loadingBox}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={notices}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ReadProgressCard
              notice={item}
              onTogglePin={() => handleTogglePin(item)}
              onViewNotRead={() => handleViewNotRead(item)}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
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
          ListEmptyComponent={
            <EmptyState
              title="No notices yet"
              message="Publish your first project notice to keep buyers informed."
              action={
                <PrimaryButton
                  title="Compose Notice"
                  onPress={() => router.push('/compose')}
                />
              }
            />
          }
        />
      )}

      <Modal
        visible={notReadModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setNotReadModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <View
            style={[
              styles.notReadCard,
              {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.line,
                borderRadius: theme.shape.cardRadius,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text
                  style={[
                    styles.notReadTitle,
                    {
                      color: theme.colors.text,
                      fontFamily: theme.typography.headingFont,
                      fontSize: 18,
                    },
                  ]}
                  numberOfLines={1}
                >
                  Unread by Residents
                </Text>
                <Text
                  style={[
                    styles.notReadNoticeName,
                    {
                      color: theme.colors.muted,
                      fontFamily: theme.typography.bodyFont,
                      fontSize: theme.typography.smallSize + 1,
                    },
                  ]}
                  numberOfLines={1}
                >
                  Notice: {selectedNotice?.title}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setNotReadModalVisible(false)}
                style={styles.closeBtn}
                accessibilityLabel="Close"
              >
                <Text style={[styles.closeIcon, { color: theme.colors.text }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {loadingNotRead ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text
                  style={[
                    styles.loadingText,
                    {
                      color: theme.colors.muted,
                      fontFamily: theme.typography.bodyMedium,
                      marginTop: 12,
                    },
                  ]}
                >
                  Computing unread targets...
                </Text>
              </View>
            ) : (
              <FlatList
                data={notReadList}
                keyExtractor={(item) => item.id}
                style={{ maxHeight: 380 }}
                renderItem={({ item }) => (
                  <View
                    style={[
                      styles.notReadRow,
                      {
                        borderColor: theme.colors.line,
                      },
                    ]}
                  >
                    <View>
                      <Text
                        style={[
                          styles.notReadUnit,
                          {
                            color: theme.colors.text,
                            fontFamily: theme.typography.headingFont,
                            fontSize: 16,
                          },
                        ]}
                      >
                        Unit {item.tower}-{item.unit}
                      </Text>
                      <Text
                        style={[
                          styles.notReadName,
                          {
                            color: theme.colors.muted,
                            fontFamily: theme.typography.bodyFont,
                            fontSize: theme.typography.smallSize + 1,
                          },
                        ]}
                      >
                        {item.buyerName || 'Buyer'} · {item.phone}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.unreadPill,
                        {
                          backgroundColor: theme.colors.surface,
                          borderColor: theme.colors.primary,
                          borderRadius: theme.shape.smallRadius,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.unreadPillText,
                          {
                            color: theme.colors.primary,
                            fontFamily: theme.typography.bodyBold,
                            fontSize: theme.typography.smallSize,
                          },
                        ]}
                      >
                        Not Read
                      </Text>
                    </View>
                  </View>
                )}
                ListEmptyComponent={
                  <EmptyState
                    title="All targeted buyers have read"
                    message="Every resident targeted by this notice has opened and viewed it."
                  />
                }
              />
            )}

            <PrimaryButton
              title="Close"
              onPress={() => setNotReadModalVisible(false)}
              variant="outline"
              style={{ marginTop: 14 }}
            />
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  screenTitle: {
    letterSpacing: -0.5,
  },
  subtitle: {
    marginBottom: 6,
  },
  plusButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusIcon: {
    fontSize: 26,
    fontWeight: '700',
    marginTop: -2,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  loadingBox: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  centerBox: {
    padding: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notReadCard: {
    width: '100%',
    maxWidth: 460,
    padding: 22,
    borderWidth: 1,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  notReadTitle: {
    letterSpacing: -0.2,
  },
  notReadNoticeName: {
    marginTop: 2,
  },
  closeBtn: {
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
  loadingText: {
    fontSize: 14,
  },
  notReadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  notReadUnit: {
    marginBottom: 2,
  },
  notReadName: {},
  unreadPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  unreadPillText: {},
});