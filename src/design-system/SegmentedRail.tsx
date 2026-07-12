import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export type SegmentedRailItem = {
  key: string;
  label: string;
  count?: number;
  icon?: string;
};

type SegmentedRailProps = {
  items: SegmentedRailItem[];
  activeKey: string;
  onChange: (key: string) => void;
  colors: any;
  fontSize?: number;
};

const TAB_HEIGHT = 40;

const SegmentedRail: React.FC<SegmentedRailProps> = ({
  items,
  activeKey,
  onChange,
  colors,
  fontSize = 11,
}) => {
  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((item) => {
          const active = item.key === activeKey;
          return (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.tabBtn,
                {
                  backgroundColor: active ? colors.primary : colors.surface,
                  borderColor: active ? colors.primary : colors.border + '55',
                },
              ]}
              onPress={() => onChange(item.key)}
              activeOpacity={0.85}
            >
              {item.icon ? (
                <Icon
                  name={item.icon}
                  size={14}
                  color={active ? '#fff' : colors.textSecondary}
                />
              ) : null}
              <Text
                style={[
                  styles.tabBtnText,
                  {
                    color: active ? '#fff' : colors.textSecondary,
                    fontSize,
                  },
                ]}
              >
                {item.label}
              </Text>
              {typeof item.count === 'number' ? (
                <View
                  style={[
                    styles.countPill,
                    {
                      backgroundColor: active ? 'rgba(255,255,255,0.28)' : colors.border + '90',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.countText,
                      { color: active ? '#fff' : colors.textSecondary },
                    ]}
                  >
                    {item.count}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 8,
    width: '100%',
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 8,
  },
  tabBtn: {
    height: TAB_HEIGHT,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  tabBtnText: {
    fontWeight: '700',
  },
  countPill: {
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 9,
    fontWeight: '700',
  },
});

export default SegmentedRail;
