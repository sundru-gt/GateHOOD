import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Modal,
  FlatList,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../../src/ThemeProvider';
import GreetingHeader from '../../src/components/GreetingHeader';
import StatTile from '../../src/components/StatTile';
import PrimaryButton from '../../src/components/PrimaryButton';
import Chip from '../../src/components/Chip';
import Skeleton from '../../src/components/Skeleton';
import ErrorCard from '../../src/components/ErrorCard';
import EmptyState from '../../src/components/EmptyState';
import {
  fetchResidentsOverview,
  importBuyersFromCSV,
  fetchAllInviteCodes,
} from '../../src/services/unitService';
import { logoutUser } from '../../src/services/authService';

export default function ResidentsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, isDark, toggleTheme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [overview, setOverview] = useState({
    totalUnits: 0,
    totalJoined: 0,
    totalPending: 0,
    towers: [],
    allUnits: [],
  });

  const [selectedTower, setSelectedTower] = useState(null);
  const [drilldownFilter, setDrilldownFilter] = useState('all');
  const [drilldownVisible, setDrilldownVisible] = useState(false);

  const [inviteCodesVisible, setInviteCodesVisible] = useState(false);
  const [inviteCodes, setInviteCodes] = useState([]);
  const [loadingCodes, setLoadingCodes] = useState(false);

  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState(null);

  const [settingsVisible, setSettingsVisible] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setError(null);
      const res = await fetchResidentsOverview();
      setOverview(res);
    } catch (err) {
      console.warn('Error fetching residents:', err);
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

  const handleOpenDrilldown = (towerItem) => {
    setSelectedTower(towerItem);
    setDrilldownFilter('all');
    setDrilldownVisible(true);
  };

  const handleViewInviteCodes = async () => {
    setLoadingCodes(true);
    setInviteCodesVisible(true);
    try {
      const codes = await fetchAllInviteCodes();
      setInviteCodes(codes);
    } catch (err) {
      console.warn('Error fetching codes:', err);
    } finally {
      setLoadingCodes(false);
    }
  };

  const handleShareCode = async (codeItem) => {
    const message = `Gatehood Residences: Use invite code ${codeItem.code} to join Tower ${codeItem.tower} Unit ${codeItem.unit}. Valid for 30 days.`;
    try {
      if (await Sharing.isAvailableAsync()) {
        if (typeof navigator !== 'undefined' && navigator.share) {
          await navigator.share({
            title: 'Gatehood Invite Code',
            text: message,
          });
        } else {
          const fileUri = `${FileSystem.cacheDirectory}invite-${codeItem.code}.txt`;
          await FileSystem.writeAsStringAsync(fileUri, message);
          await Sharing.shareAsync(fileUri);
        }
      } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(message);
        Alert.alert('Copied to Clipboard', message);
      } else {
        Alert.alert('Invite Code', message);
      }
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  const handlePickCSV = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'text/plain'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const fileAsset = result.assets[0];
      setImporting(true);
      setImportSummary(null);

      let csvContent;
      if (Platform.OS === 'web') {
        if (fileAsset.file) {
          csvContent = await fileAsset.file.text();
        } else {
          const res = await fetch(fileAsset.uri);
          csvContent = await res.text();
        }
      } else {
        csvContent = await FileSystem.readAsStringAsync(fileAsset.uri);
      }
      const summary = await importBuyersFromCSV(csvContent);

      setImportSummary(summary);
      loadData();
    } catch (err) {
      console.warn('CSV Picker error:', err);
      Alert.alert('Import Error', err.message || 'Failed to parse CSV file.');
    } finally {
      setImporting(false);
    }
  };

  const handleImportSampleCSV = async () => {
    const sampleCsv = `tower,unit,name,phone
A,1501,Aditya Kapoor,+91 9823412345
A,1502,Sneha Verma,+91 9811234567
B,1601,Rohan Deshmukh,+91 9876543210
C,1701,Priya Nair,+91 9845098765
A,101,Duplicate Test,+91 9800000000
INVALID,,Bad Row,`;

    setImporting(true);
    setImportSummary(null);
    try {
      const summary = await importBuyersFromCSV(sampleCsv);
      setImportSummary(summary);
      loadData();
    } catch (err) {
      Alert.alert('Import Error', err.message);
    } finally {
      setImporting(false);
    }
  };

  const filteredUnits = selectedTower
    ? selectedTower.units.filter((u) => {
        if (drilldownFilter === 'joined') return u.joined;
        if (drilldownFilter === 'pending') return !u.joined;
        return true;
      })
    : [];

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
          greeting="Project Builder"
          name="Sky Residences"
          onAvatarPress={() => setSettingsVisible(true)}
        />

        {error ? (
          <ErrorCard message={error} onRetry={loadData} />
        ) : loading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.statsRow}>
              <Skeleton width="48%" height={90} borderRadius={theme.shape.smallRadius} />
              <Skeleton width="48%" height={90} borderRadius={theme.shape.smallRadius} />
            </View>
            <Skeleton width="100%" height={120} borderRadius={theme.shape.cardRadius} style={{ marginVertical: 8 }} />
            <Skeleton width="100%" height={120} borderRadius={theme.shape.cardRadius} style={{ marginVertical: 8 }} />
          </View>
        ) : (
          <>
            <View style={styles.statsRow}>
              <StatTile
                label="Joined Residents"
                value={overview.totalJoined}
                subtitle={`${overview.totalUnits > 0 ? Math.round((overview.totalJoined / overview.totalUnits) * 100) : 0}% Onboarded`}
                highlight={true}
                style={styles.halfTile}
              />
              <StatTile
                label="Pending Invites"
                value={overview.totalPending}
                subtitle="Awaiting App Join"
                style={styles.halfTile}
              />
            </View>

            <View style={styles.buttonRow}>
              <PrimaryButton
                title="Import Buyers (CSV)"
                onPress={() => setImportModalVisible(true)}
                style={styles.actionBtn}
              />
              <PrimaryButton
                title="View Codes"
                onPress={handleViewInviteCodes}
                variant="secondary"
                style={styles.actionBtn}
              />
            </View>

            <Text
              style={[
                styles.sectionTitle,
                {
                  color: theme.colors.text,
                  fontFamily: theme.typography.headingFont,
                  fontSize: theme.typography.titleSize - 2,
                },
              ]}
            >
              By Tower Breakdown
            </Text>

            {overview.towers.map((item) => {
              const pct = item.total > 0 ? Math.round((item.joined / item.total) * 100) : 0;
              return (
                <TouchableOpacity
                  key={item.tower}
                  activeOpacity={0.8}
                  onPress={() => handleOpenDrilldown(item)}
                  style={[
                    styles.towerCard,
                    {
                      backgroundColor: theme.colors.card,
                      borderColor: theme.colors.line,
                      borderRadius: theme.shape.cardRadius,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Tower ${item.tower}: ${item.joined} of ${item.total} joined. Tap for drill-down.`}
                >
                  <View style={styles.towerHeader}>
                    <View>
                      <Text
                        style={[
                          styles.towerTitle,
                          {
                            color: theme.colors.text,
                            fontFamily: theme.typography.headingFont,
                            fontSize: 18,
                          },
                        ]}
                      >
                        Tower {item.tower}
                      </Text>
                      <Text
                        style={[
                          styles.towerSub,
                          {
                            color: theme.colors.muted,
                            fontFamily: theme.typography.bodyFont,
                            fontSize: theme.typography.smallSize + 1,
                          },
                        ]}
                      >
                        {item.joined} / {item.total} buyers joined
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.towerPct,
                        {
                          color: theme.colors.primary,
                          fontFamily: theme.typography.headingFont,
                          fontSize: 20,
                        },
                      ]}
                    >
                      {pct}%
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.barTrack,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: theme.colors.line,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${pct}%`,
                          backgroundColor: theme.colors.primary,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.towerFooter}>
                    <Text
                      style={[
                        styles.towerDetailLink,
                        {
                          color: theme.colors.primary,
                          fontFamily: theme.typography.bodyMedium,
                          fontSize: theme.typography.smallSize + 1,
                        },
                      ]}
                    >
                      Drill down to Joined & Pending buyers →
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>

      <Modal
        visible={drilldownVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setDrilldownVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <View
            style={[
              styles.drilldownCard,
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
                  styles.modalTitle,
                  {
                    color: theme.colors.text,
                    fontFamily: theme.typography.headingFont,
                    fontSize: 20,
                  },
                ]}
              >
                Tower {selectedTower?.tower} Residents
              </Text>
              <TouchableOpacity
                onPress={() => setDrilldownVisible(false)}
                style={styles.closeBtn}
                accessibilityLabel="Close"
              >
                <Text style={[styles.closeIcon, { color: theme.colors.text }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.chipRow}>
              <Chip
                label="All"
                count={selectedTower?.total}
                selected={drilldownFilter === 'all'}
                onPress={() => setDrilldownFilter('all')}
              />
              <Chip
                label="Joined"
                count={selectedTower?.joined}
                selected={drilldownFilter === 'joined'}
                onPress={() => setDrilldownFilter('joined')}
              />
              <Chip
                label="Pending"
                count={selectedTower?.pending}
                selected={drilldownFilter === 'pending'}
                onPress={() => setDrilldownFilter('pending')}
              />
            </View>

            <FlatList
              data={filteredUnits}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 380 }}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.residentRow,
                    {
                      borderColor: theme.colors.line,
                    },
                  ]}
                >
                  <View style={styles.residentInfo}>
                    <Text
                      style={[
                        styles.unitBadge,
                        {
                          color: theme.colors.text,
                          fontFamily: theme.typography.headingFont,
                          fontSize: 16,
                        },
                      ]}
                    >
                      {item.tower}-{item.unit}
                    </Text>
                    <Text
                      style={[
                        styles.buyerName,
                        {
                          color: theme.colors.text,
                          fontFamily: theme.typography.bodyMedium,
                          fontSize: theme.typography.baseSize - 1,
                        },
                      ]}
                    >
                      {item.buyerName || 'Unassigned'}
                    </Text>
                    <Text
                      style={[
                        styles.buyerPhone,
                        {
                          color: theme.colors.muted,
                          fontFamily: theme.typography.bodyFont,
                          fontSize: theme.typography.smallSize,
                        },
                      ]}
                    >
                      {item.config} · {item.phone}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: item.joined
                          ? theme.colors.surface
                          : 'transparent',
                        borderColor: item.joined
                          ? theme.colors.primary
                          : theme.colors.line,
                        borderRadius: theme.shape.smallRadius,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color: item.joined
                            ? theme.colors.primary
                            : theme.colors.muted,
                          fontFamily: theme.typography.bodyBold,
                          fontSize: theme.typography.smallSize,
                        },
                      ]}
                    >
                      {item.joined ? 'Joined' : 'Pending'}
                    </Text>
                  </View>
                </View>
              )}
            />

            <PrimaryButton
              title="Close"
              onPress={() => setDrilldownVisible(false)}
              variant="outline"
              style={{ marginTop: 14 }}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={importModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setImportModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <View
            style={[
              styles.importCard,
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
                  styles.modalTitle,
                  {
                    color: theme.colors.text,
                    fontFamily: theme.typography.headingFont,
                    fontSize: 20,
                  },
                ]}
              >
                Import Buyers via CSV
              </Text>
              <TouchableOpacity
                onPress={() => setImportModalVisible(false)}
                style={styles.closeBtn}
              >
                <Text style={[styles.closeIcon, { color: theme.colors.text }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text
              style={[
                styles.importInstructions,
                {
                  color: theme.colors.muted,
                  fontFamily: theme.typography.bodyFont,
                  fontSize: theme.typography.baseSize - 1,
                },
              ]}
            >
              CSV columns required: <Text style={{ color: theme.colors.text, fontWeight: '700' }}>tower, unit, name, phone</Text>. Rows will be validated and duplicates by tower+unit will be automatically skipped.
            </Text>

            <View style={{ gap: 10, marginVertical: 14 }}>
              <PrimaryButton
                title={importing ? 'Processing CSV...' : 'Select CSV File'}
                onPress={handlePickCSV}
                loading={importing}
              />
              <PrimaryButton
                title="Import Sample CSV"
                onPress={handleImportSampleCSV}
                variant="outline"
                disabled={importing}
              />
            </View>

            {importSummary && (
              <ScrollView style={styles.summaryBox}>
                <Text
                  style={[
                    styles.summaryHeading,
                    {
                      color: theme.colors.primary,
                      fontFamily: theme.typography.headingFont,
                      fontSize: 16,
                    },
                  ]}
                >
                  Import Summary
                </Text>
                <Text
                  style={[
                    styles.summaryText,
                    {
                      color: theme.colors.text,
                      fontFamily: theme.typography.bodyMedium,
                      fontSize: theme.typography.baseSize - 1,
                    },
                  ]}
                >
                  Total rows parsed: {importSummary.totalRows} | Successfully imported: {importSummary.importedCount}
                </Text>

                {importSummary.errors?.length > 0 && (
                  <View style={{ marginTop: 8 }}>
                    <Text
                      style={[
                        styles.errorHeading,
                        {
                          color: theme.colors.error,
                          fontFamily: theme.typography.headingFont,
                          fontSize: 14,
                        },
                      ]}
                    >
                      Validation Warnings ({importSummary.errors.length}):
                    </Text>
                    {importSummary.errors.map((err, idx) => (
                      <Text
                        key={idx}
                        style={[
                          styles.errorItem,
                          {
                            color: theme.colors.error,
                            fontFamily: theme.typography.bodyFont,
                            fontSize: theme.typography.smallSize,
                          },
                        ]}
                      >
                        • {err}
                      </Text>
                    ))}
                  </View>
                )}

                {importSummary.createdInvites?.length > 0 && (
                  <View style={{ marginTop: 8 }}>
                    <Text
                      style={[
                        styles.invitesCreatedHeading,
                        {
                          color: theme.colors.text,
                          fontFamily: theme.typography.headingFont,
                          fontSize: 14,
                        },
                      ]}
                    >
                      Generated Invite Codes:
                    </Text>
                    {importSummary.createdInvites.map((inv) => (
                      <Text
                        key={inv.code}
                        style={[
                          styles.inviteRowItem,
                          {
                            color: theme.colors.text,
                            fontFamily: theme.typography.bodyFont,
                            fontSize: theme.typography.smallSize,
                          },
                        ]}
                      >
                        Unit {inv.unitId}: <Text style={{ fontWeight: '700', color: theme.colors.primary }}>{inv.code}</Text>
                      </Text>
                    ))}
                  </View>
                )}
              </ScrollView>
            )}

            <PrimaryButton
              title="Done"
              onPress={() => setImportModalVisible(false)}
              variant="secondary"
              style={{ marginTop: 12 }}
            />
          </View>
        </View>
      </Modal>

      <Modal
        visible={inviteCodesVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setInviteCodesVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}>
          <View
            style={[
              styles.drilldownCard,
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
                  styles.modalTitle,
                  {
                    color: theme.colors.text,
                    fontFamily: theme.typography.headingFont,
                    fontSize: 20,
                  },
                ]}
              >
                Resident Invite Codes
              </Text>
              <TouchableOpacity
                onPress={() => setInviteCodesVisible(false)}
                style={styles.closeBtn}
              >
                <Text style={[styles.closeIcon, { color: theme.colors.text }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {loadingCodes ? (
              <View style={{ padding: 30, alignItems: 'center' }}>
                <Skeleton width="100%" height={50} borderRadius={theme.shape.smallRadius} style={{ marginVertical: 6 }} />
                <Skeleton width="100%" height={50} borderRadius={theme.shape.smallRadius} style={{ marginVertical: 6 }} />
                <Skeleton width="100%" height={50} borderRadius={theme.shape.smallRadius} style={{ marginVertical: 6 }} />
              </View>
            ) : (
              <FlatList
                data={inviteCodes}
                keyExtractor={(item) => item.code}
                style={{ maxHeight: 380 }}
                renderItem={({ item }) => (
                  <View
                    style={[
                      styles.codeRow,
                      {
                        borderColor: theme.colors.line,
                      },
                    ]}
                  >
                    <View>
                      <Text
                        style={[
                          styles.codeText,
                          {
                            color: theme.colors.primary,
                            fontFamily: theme.typography.headingFont,
                            fontSize: 16,
                          },
                        ]}
                      >
                        {item.code}
                      </Text>
                      <Text
                        style={[
                          styles.codeSub,
                          {
                            color: theme.colors.muted,
                            fontFamily: theme.typography.bodyFont,
                            fontSize: theme.typography.smallSize,
                          },
                        ]}
                      >
                        Unit {item.unitId || `${item.tower}-${item.unit}`} · {item.usedBy ? 'Redeemed' : 'Active'}
                      </Text>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleShareCode(item)}
                      style={[
                        styles.shareBtn,
                        {
                          backgroundColor: theme.colors.surface,
                          borderColor: theme.colors.line,
                          borderRadius: theme.shape.smallRadius,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Share invite code ${item.code}`}
                    >
                      <Text
                        style={[
                          styles.shareBtnText,
                          {
                            color: theme.colors.text,
                            fontFamily: theme.typography.headingFont,
                            fontSize: theme.typography.smallSize,
                          },
                        ]}
                      >
                        Share
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
                ListEmptyComponent={
                  <EmptyState
                    title="No invite codes found"
                    message="Import buyers or run the seed script to generate codes."
                  />
                }
              />
            )}

            <PrimaryButton
              title="Close"
              onPress={() => setInviteCodesVisible(false)}
              variant="outline"
              style={{ marginTop: 12 }}
            />
          </View>
        </View>
      </Modal>

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
                Builder Controls
              </Text>
              <TouchableOpacity
                onPress={() => setSettingsVisible(false)}
                style={styles.closeBtn}
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

            <View style={{ marginTop: 20, gap: 10 }}>
              <PrimaryButton
                title="Switch to Buyer View"
                onPress={() => {
                  setSettingsVisible(false);
                  router.replace('/my-unit');
                }}
                variant="secondary"
              />
              <PrimaryButton
                title="Log Out"
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
  loadingContainer: {
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
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 10,
  },
  actionBtn: {
    flex: 1,
  },
  sectionTitle: {
    marginTop: 18,
    marginBottom: 10,
  },
  towerCard: {
    padding: 18,
    borderWidth: 1,
    marginVertical: 8,
  },
  towerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  towerTitle: {
    letterSpacing: -0.2,
  },
  towerSub: {
    marginTop: 2,
  },
  towerPct: {},
  barTrack: {
    height: 10,
    width: '100%',
    borderRadius: 5,
    overflow: 'hidden',
    borderWidth: 0.5,
    marginVertical: 8,
  },
  barFill: {
    height: 10,
    borderRadius: 5,
  },
  towerFooter: {
    marginTop: 6,
  },
  towerDetailLink: {
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  drilldownCard: {
    width: '100%',
    maxWidth: 460,
    padding: 22,
    borderWidth: 1,
    maxHeight: '85%',
  },
  importCard: {
    width: '100%',
    maxWidth: 460,
    padding: 22,
    borderWidth: 1,
    maxHeight: '85%',
  },
  settingsCard: {
    width: '100%',
    maxWidth: 420,
    padding: 22,
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    letterSpacing: -0.2,
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
  chipRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  residentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  residentInfo: {
    flex: 1,
    paddingRight: 8,
  },
  unitBadge: {
    marginBottom: 2,
  },
  buyerName: {
    fontWeight: '600',
  },
  buyerPhone: {
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  statusText: {},
  importInstructions: {
    lineHeight: 20,
    marginBottom: 10,
  },
  summaryBox: {
    maxHeight: 180,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(150, 150, 150, 0.3)',
    borderRadius: 8,
    marginVertical: 10,
  },
  summaryHeading: {
    marginBottom: 4,
  },
  summaryText: {
    marginBottom: 6,
  },
  errorHeading: {
    marginBottom: 4,
  },
  errorItem: {
    marginLeft: 6,
    marginBottom: 2,
  },
  invitesCreatedHeading: {
    marginTop: 6,
    marginBottom: 4,
  },
  inviteRowItem: {
    marginBottom: 2,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  codeText: {
    letterSpacing: 1,
  },
  codeSub: {
    marginTop: 2,
  },
  shareBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    minHeight: 44,
    justifyContent: 'center',
  },
  shareBtnText: {
    fontWeight: '700',
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
});