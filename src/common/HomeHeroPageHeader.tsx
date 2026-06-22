import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { HOME_HERO_GRADIENT, HOME_M3 } from '../theme/brandColors';

type HomeHeroPageHeaderProps = {
  title: string;
  onBack: () => void;
  backIcon?: 'arrow-back' | 'close';
  titleFontSize?: number;
  subtitle?: string;
  subtitleFontSize?: number;
};

const TOOLBAR_HEIGHT = 56;
const SUBTITLE_BLOCK_HEIGHT = 36;

export function HomeHeroPageHeader({
  title,
  onBack,
  backIcon = 'arrow-back',
  titleFontSize = 18,
  subtitle,
  subtitleFontSize = 13,
}: HomeHeroPageHeaderProps) {
  const insets = useSafeAreaInsets();
  const bodyHeight = TOOLBAR_HEIGHT + (subtitle ? SUBTITLE_BLOCK_HEIGHT : 0);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={HOME_M3.primary} />
      <View
        style={[
          styles.shell,
          { paddingTop: insets.top, height: insets.top + bodyHeight },
        ]}
      >
        <LinearGradient
          colors={[...HOME_HERO_GRADIENT]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={[styles.toolbar, { height: TOOLBAR_HEIGHT }]}>
          <TouchableOpacity
            onPress={onBack}
            style={styles.sideBtn}
            hitSlop={10}
            accessibilityLabel="Go back"
          >
            <MaterialIcon name={backIcon} size={22} color={HOME_M3.onPrimary} />
          </TouchableOpacity>
          <Text
            style={[
              styles.title,
              { fontSize: titleFontSize },
              Platform.OS === 'android' ? { includeFontPadding: false } : null,
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          <View style={styles.sideBtn} />
        </View>
        {subtitle ? (
          <Text
            style={[
              styles.subtitle,
              { fontSize: subtitleFontSize },
              Platform.OS === 'android' ? { includeFontPadding: false } : null,
            ]}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: 'relative',
    backgroundColor: HOME_M3.primary,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  sideBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '700',
    color: HOME_M3.onPrimary,
    letterSpacing: -0.2,
    lineHeight: 22,
    paddingHorizontal: 4,
  },
  subtitle: {
    textAlign: 'center',
    color: HOME_M3.onPrimaryContainer,
    fontWeight: '500',
    lineHeight: 18,
    paddingHorizontal: 52,
    paddingBottom: 8,
  },
});

export default HomeHeroPageHeader;
