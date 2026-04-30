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

const SegmentedRail: React.FC<SegmentedRailProps> = ({ items, activeKey, onChange, colors, fontSize = 12 }) => {
  return (
    <View style={[styles.wrap, { backgroundColor: colors.background + 'F0' }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.rail, { backgroundColor: colors.surface, borderColor: colors.border + '55' }]}>
          {items.map((item) => {
            const active = item.key === activeKey;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.tabBtn, active && { backgroundColor: colors.primary + 'E8' }]}
                onPress={() => onChange(item.key)}
                activeOpacity={0.85}
              >
                {item.icon ? (
                  <Icon name={item.icon} size={14} color={active ? '#fff' : colors.textSecondary} />
                ) : null}
                <Text style={[styles.tabBtnText, { color: active ? '#fff' : colors.textSecondary, fontSize }]}>
                  {item.label}
                </Text>
                {typeof item.count === 'number' ? (
                  <View style={[styles.countPill, { backgroundColor: active ? '#ffffff35' : colors.border + '90' }]}>
                    <Text style={[styles.countText, { color: active ? '#fff' : colors.textSecondary }]}>{item.count}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 10,
    paddingHorizontal: 20,
    paddingBottom: 4,
    zIndex: 20,
  },
  scrollContent: {
    paddingRight: 8,
  },
  rail: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 16,
    padding: 6,
    gap: 6,
  },
  tabBtn: {
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tabBtnText: {
    fontWeight: '700',
  },
  countPill: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  countText: {
    fontSize: 10,
    fontWeight: '700',
  },
});

export default SegmentedRail;
