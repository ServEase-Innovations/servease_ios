import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../Settings/ThemeContext';
import { BRAND } from '../theme/brandColors';
import { fetchProviderLanguages, PROVIDER_REGISTRATION_LANGUAGES_FALLBACK } from '../services/providerLanguagesApi';

interface FilterProps {
  open: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterCriteria) => void;
  initialFilters?: FilterCriteria;
}

export interface FilterCriteria {
  experience: number[];
  rating: number | null;
  gender: string | null;
  diet: string | null;
  language: string[];
  distance: number[];
}

export const DEFAULT_FILTER_CRITERIA: FilterCriteria = {
  experience: [0, 30],
  rating: null,
  gender: null,
  diet: null,
  language: [],
  distance: [0, 50],
};

const GENDER_OPTIONS = [
  { value: 'MALE', labelKey: 'male' },
  { value: 'FEMALE', labelKey: 'female' },
  { value: 'OTHER', labelKey: 'other' },
] as const;

const DIET_OPTIONS = [
  { value: 'VEG', labelKey: 'veg' },
  { value: 'NONVEG', labelKey: 'nonveg' },
  { value: 'BOTH', labelKey: 'both' },
] as const;

function countActiveFilters(filters: FilterCriteria): number {
  let count = 0;
  if (filters.experience[0] > 0 || filters.experience[1] < 30) count += 1;
  if (filters.rating) count += 1;
  if (filters.distance[0] > 0 || filters.distance[1] < 50) count += 1;
  if (filters.gender) count += 1;
  if (filters.diet) count += 1;
  if (filters.language.length > 0) count += 1;
  return count;
}

function formatRangeSummary(
  min: number,
  max: number,
  maxLimit: number,
  unit: string,
  anyLabel: string
): string {
  if (min <= 0 && max >= maxLimit) return anyLabel;
  if (min <= 0) return `Up to ${max} ${unit}`;
  if (max >= maxLimit) return `${min}+ ${unit}`;
  return `${min}–${max} ${unit}`;
}

const ProviderFilter: React.FC<FilterProps> = ({
  open,
  onClose,
  onApplyFilters,
  initialFilters,
}) => {
  const { t } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();
  const { colors, isDarkMode, fontSize, compactMode } = useTheme();
  const insets = useSafeAreaInsets();
  const sliderWidth = Math.max(220, screenWidth - 72);

  const fontStyles = useMemo(() => {
    switch (fontSize) {
      case 'small':
        return { textSize: 14, headingSize: 18, smallText: 12, labelSize: 13 };
      case 'large':
        return { textSize: 18, headingSize: 24, smallText: 16, labelSize: 15 };
      default:
        return { textSize: 16, headingSize: 20, smallText: 14, labelSize: 14 };
    }
  }, [fontSize]);

  const spacing = compactMode ? 0.85 : 1;
  const primary = colors.primary || BRAND.accent;

  const [filters, setFilters] = useState<FilterCriteria>(initialFilters || DEFAULT_FILTER_CRITERIA);
  const [tempFilters, setTempFilters] = useState<FilterCriteria>(filters);
  const [languageSearch, setLanguageSearch] = useState('');
  const [languageOptions, setLanguageOptions] = useState<string[]>([
    ...PROVIDER_REGISTRATION_LANGUAGES_FALLBACK,
  ]);
  const [languagesLoading, setLanguagesLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLanguagesLoading(true);
    fetchProviderLanguages()
      .then((languages) => {
        if (!cancelled && languages.length > 0) setLanguageOptions(languages);
      })
      .finally(() => {
        if (!cancelled) setLanguagesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (open) {
      const next = initialFilters || filters;
      setTempFilters(next);
      setLanguageSearch('');
    }
  }, [open, initialFilters, filters]);

  const activeCount = countActiveFilters(tempFilters);

  const filteredLanguages = useMemo(() => {
    const q = languageSearch.trim().toLowerCase();
    if (!q) return languageOptions;
    return languageOptions.filter((lang) => lang.toLowerCase().includes(q));
  }, [languageOptions, languageSearch]);

  const toggleSingle = (field: 'gender' | 'diet', value: string) => {
    setTempFilters((prev) => ({
      ...prev,
      [field]: prev[field] === value ? null : value,
    }));
  };

  const handleLanguageToggle = (language: string) => {
    setTempFilters((prev) => ({
      ...prev,
      language: prev.language.includes(language)
        ? prev.language.filter((l) => l !== language)
        : [...prev.language, language],
    }));
  };

  const handleApply = () => {
    setFilters(tempFilters);
    onApplyFilters(tempFilters);
    onClose();
  };

  const handleReset = () => {
    setTempFilters(DEFAULT_FILTER_CRITERIA);
    setLanguageSearch('');
  };

  const sectionSurface = isDarkMode ? colors.surface : '#F8FAFC';
  const sectionBorder = isDarkMode ? colors.border : '#E2E8F0';

  const renderSection = (
    icon: string,
    title: string,
    summary: string,
    children: React.ReactNode
  ) => (
    <View
      style={[
        styles.sectionCard,
        {
          backgroundColor: sectionSurface,
          borderColor: sectionBorder,
          padding: 14 * spacing,
          marginBottom: 12 * spacing,
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIconWrap, { backgroundColor: `${primary}18` }]}>
          <Icon name={icon} size={18} color={primary} />
        </View>
        <View style={styles.sectionHeaderText}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontStyles.labelSize }]}>
            {title}
          </Text>
          <Text style={[styles.sectionSummary, { color: colors.textSecondary, fontSize: fontStyles.smallText }]}>
            {summary}
          </Text>
        </View>
      </View>
      {children}
    </View>
  );

  const renderRangeSlider = (
    values: number[],
    min: number,
    max: number,
    onChange: (next: number[]) => void
  ) => (
    <View style={styles.sliderWrap}>
      <MultiSlider
        values={values}
        min={min}
        max={max}
        step={1}
        sliderLength={sliderWidth}
        onValuesChange={onChange}
        selectedStyle={{ backgroundColor: primary }}
        unselectedStyle={{ backgroundColor: sectionBorder }}
        trackStyle={{ height: 4, borderRadius: 2 }}
        markerStyle={{
          height: 22,
          width: 22,
          borderRadius: 11,
          backgroundColor: primary,
          borderWidth: 2,
          borderColor: '#fff',
          shadowColor: '#0f172a',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 3,
          elevation: 3,
        }}
        containerStyle={{ height: 36, alignSelf: 'center' }}
      />
      <View style={[styles.sliderTicks, { width: sliderWidth }]}>
        <Text style={[styles.tickLabel, { color: colors.textSecondary, fontSize: fontStyles.smallText }]}>
          {min}
        </Text>
        <Text style={[styles.tickLabel, { color: colors.textSecondary, fontSize: fontStyles.smallText }]}>
          {max}
        </Text>
      </View>
    </View>
  );

  const renderChoiceChips = (
    options: ReadonlyArray<{ value: string; labelKey: string }>,
    field: 'gender' | 'diet',
    selected: string | null
  ) => (
    <View style={[styles.chipRow, { gap: 8 * spacing }]}>
      {options.map(({ value, labelKey }) => {
        const isSelected = selected === value;
        return (
          <TouchableOpacity
            key={value}
            style={[
              styles.choiceChip,
              {
                borderColor: isSelected ? primary : sectionBorder,
                backgroundColor: isSelected ? primary : isDarkMode ? colors.card : '#fff',
                paddingHorizontal: 14 * spacing,
                paddingVertical: 8 * spacing,
              },
            ]}
            onPress={() => toggleSingle(field, value)}
            activeOpacity={0.75}
          >
            <Text
              style={[
                styles.choiceChipText,
                {
                  color: isSelected ? '#fff' : colors.text,
                  fontSize: fontStyles.smallText,
                  fontWeight: isSelected ? '700' : '500',
                },
              ]}
            >
              {t(`details.filter.${labelKey}`)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
        <View
          style={[
            styles.drawer,
            { backgroundColor: colors.background, maxHeight: '92%' },
          ]}
        >
          <View style={styles.headerShell}>
            <LinearGradient
              colors={isDarkMode ? ['#1e293b', '#0f172a'] : [BRAND.accent, BRAND.bookingSky]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                styles.headerContent,
                { paddingHorizontal: 16 * spacing, paddingBottom: 14 * spacing },
              ]}
            >
              <View style={styles.handleWrap}>
                <View style={[styles.handle, { backgroundColor: 'rgba(255,255,255,0.35)' }]} />
              </View>

              <View style={styles.headerRow}>
                <View style={styles.headerBody}>
                  <View style={styles.headerIconWrap}>
                    <Icon name="tune" size={22} color="#fff" />
                  </View>
                  <View style={styles.headerCopy}>
                    <View style={styles.headerTitleRow}>
                      <Text
                        style={[styles.headerText, { fontSize: fontStyles.headingSize }]}
                        numberOfLines={1}
                      >
                        {t('details.filter.title')}
                      </Text>
                      {activeCount > 0 ? (
                        <View style={styles.activeBadge}>
                          <Text style={styles.activeBadgeText}>
                            {t('details.filter.filtersActive', { count: activeCount })}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.headerSubtitle} numberOfLines={2}>
                      {t('details.filter.subtitle')}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.close')}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={styles.closeButton}
                >
                  <Icon name="close" size={22} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={{ padding: 16 * spacing, paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            {renderSection(
              'place',
              t('details.filter.distance'),
              formatRangeSummary(
                tempFilters.distance[0],
                tempFilters.distance[1],
                50,
                t('details.filter.kmUnit'),
                t('details.filter.distanceAny')
              ),
              renderRangeSlider(tempFilters.distance, 0, 50, (values) =>
                setTempFilters((prev) => ({ ...prev, distance: values }))
              )
            )}

            {renderSection(
              'star',
              t('details.filter.minRating'),
              tempFilters.rating
                ? t('details.filter.ratingSelected', { rating: tempFilters.rating })
                : t('details.filter.ratingAny'),
              <View style={styles.ratingRow}>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const filled = (tempFilters.rating || 0) >= star;
                    return (
                      <TouchableOpacity
                        key={star}
                        onPress={() =>
                          setTempFilters((prev) => ({
                            ...prev,
                            rating: prev.rating === star ? null : star,
                          }))
                        }
                        hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                      >
                        <Icon
                          name={filled ? 'star' : 'star-border'}
                          size={32}
                          color={filled ? '#F59E0B' : sectionBorder}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <TouchableOpacity
                  style={[
                    styles.anyPill,
                    {
                      borderColor: tempFilters.rating == null ? primary : sectionBorder,
                      backgroundColor: tempFilters.rating == null ? `${primary}14` : 'transparent',
                    },
                  ]}
                  onPress={() => setTempFilters((prev) => ({ ...prev, rating: null }))}
                >
                  <Text
                    style={{
                      color: tempFilters.rating == null ? primary : colors.textSecondary,
                      fontSize: fontStyles.smallText,
                      fontWeight: '600',
                    }}
                  >
                    {t('details.filter.ratingAny')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {renderSection(
              'work-history',
              t('details.filter.experience'),
              formatRangeSummary(
                tempFilters.experience[0],
                tempFilters.experience[1],
                30,
                t('details.filter.yearsUnit'),
                t('details.filter.experienceAny')
              ),
              renderRangeSlider(tempFilters.experience, 0, 30, (values) =>
                setTempFilters((prev) => ({ ...prev, experience: values }))
              )
            )}

            {renderSection(
              'translate',
              t('details.filter.languages'),
              tempFilters.language.length > 0
                ? t('details.filter.selectedLanguages', { count: tempFilters.language.length })
                : t('details.filter.selectLanguages'),
              <View>
                <View
                  style={[
                    styles.searchField,
                    {
                      borderColor: sectionBorder,
                      backgroundColor: isDarkMode ? colors.card : '#fff',
                    },
                  ]}
                >
                  <Icon name="search" size={18} color={colors.textSecondary} />
                  <TextInput
                    value={languageSearch}
                    onChangeText={setLanguageSearch}
                    placeholder={t('details.filter.searchLanguages')}
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.searchInput, { color: colors.text, fontSize: fontStyles.smallText }]}
                  />
                  {languageSearch.length > 0 ? (
                    <TouchableOpacity onPress={() => setLanguageSearch('')}>
                      <Icon name="close" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                  ) : null}
                </View>

                {languagesLoading ? (
                  <ActivityIndicator style={{ marginTop: 12 }} color={primary} />
                ) : (
                  <View style={[styles.languageGrid, { gap: 8 * spacing, marginTop: 10 * spacing }]}>
                    {filteredLanguages.map((language) => {
                      const selected = tempFilters.language.includes(language);
                      return (
                        <TouchableOpacity
                          key={language}
                          style={[
                            styles.languageChip,
                            {
                              borderColor: selected ? primary : sectionBorder,
                              backgroundColor: selected ? `${primary}14` : isDarkMode ? colors.card : '#fff',
                            },
                          ]}
                          onPress={() => handleLanguageToggle(language)}
                        >
                          <Text
                            style={{
                              color: selected ? primary : colors.text,
                              fontSize: fontStyles.smallText,
                              fontWeight: selected ? '700' : '500',
                            }}
                            numberOfLines={1}
                          >
                            {language}
                          </Text>
                          {selected ? <Icon name="check" size={14} color={primary} /> : null}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {tempFilters.language.length > 0 ? (
                  <TouchableOpacity
                    style={styles.clearLanguagesBtn}
                    onPress={() => setTempFilters((prev) => ({ ...prev, language: [] }))}
                  >
                    <Text style={{ color: primary, fontSize: fontStyles.smallText, fontWeight: '600' }}>
                      {t('details.filter.clearLanguages')}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )}

            {renderSection(
              'person',
              t('details.filter.gender'),
              tempFilters.gender
                ? t(`details.filter.${GENDER_OPTIONS.find((o) => o.value === tempFilters.gender)?.labelKey || 'other'}`)
                : t('details.filter.anyPreference'),
              renderChoiceChips(GENDER_OPTIONS, 'gender', tempFilters.gender)
            )}

            {renderSection(
              'restaurant',
              t('details.filter.diet'),
              tempFilters.diet
                ? t(`details.filter.${DIET_OPTIONS.find((o) => o.value === tempFilters.diet)?.labelKey || 'both'}`)
                : t('details.filter.anyPreference'),
              renderChoiceChips(DIET_OPTIONS, 'diet', tempFilters.diet)
            )}
          </ScrollView>

          <View
            style={[
              styles.footer,
              {
                borderTopColor: sectionBorder,
                paddingHorizontal: 16 * spacing,
                paddingTop: 12 * spacing,
                paddingBottom: Math.max(12, insets.bottom > 0 ? 4 : 12),
                gap: 10 * spacing,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.footerBtn,
                styles.resetBtn,
                { borderColor: primary, paddingVertical: 13 * spacing },
              ]}
              onPress={handleReset}
            >
              <Text style={{ color: primary, fontSize: fontStyles.textSize, fontWeight: '700' }}>
                {t('details.filter.resetAll')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.footerBtn,
                styles.applyBtn,
                { backgroundColor: primary, paddingVertical: 13 * spacing },
              ]}
              onPress={handleApply}
            >
              <Text style={{ color: '#fff', fontSize: fontStyles.textSize, fontWeight: '700' }}>
                {activeCount > 0
                  ? `${t('details.filter.applyFilters')} (${activeCount})`
                  : t('details.filter.applyFilters')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'stretch',
  },
  drawer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 10,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  headerShell: {
    width: '100%',
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  headerContent: {
    width: '100%',
    alignSelf: 'stretch',
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
    gap: 10,
  },
  headerIconWrap: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  headerText: {
    color: '#fff',
    fontWeight: '800',
    flexShrink: 1,
  },
  headerSubtitle: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  activeBadge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexShrink: 0,
  },
  activeBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    flexShrink: 0,
  },
  content: {
    flexGrow: 0,
    flexShrink: 1,
  },
  sectionCard: {
    borderRadius: 14,
    borderWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  sectionSummary: {
    marginTop: 2,
  },
  sliderWrap: {
    alignItems: 'center',
  },
  sliderTicks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
    alignSelf: 'center',
  },
  tickLabel: {},
  ratingRow: {
    gap: 12,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  anyPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  choiceChip: {
    borderRadius: 999,
    borderWidth: 1.5,
  },
  choiceChipText: {},
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    padding: 0,
    margin: 0,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  languageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    maxWidth: '100%',
  },
  clearLanguagesBtn: {
    alignSelf: 'flex-end',
    marginTop: 10,
    paddingVertical: 4,
  },
  footer: {
    width: '100%',
    alignSelf: 'stretch',
    flexDirection: 'row',
    borderTopWidth: 1,
    backgroundColor: 'transparent',
  },
  footerBtn: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtn: {
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  applyBtn: {},
});

export default ProviderFilter;
