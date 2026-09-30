/* eslint-disable */
import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import LinearGradient from "react-native-linear-gradient";
import { useTranslation } from 'react-i18next';
import { useTheme } from "../../src/Settings/ThemeContext";

type ServiceFeature = {
  title?: string;
  items: string[];
};

type ServiceDetails = {
  title: string;
  description: string;
  features: ServiceFeature[];
  icon?: string | React.ReactNode;
};

interface ServiceDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  serviceType: "cook" | "maid" | "babycare" | null;
}

const ServiceDetailsDialog: React.FC<ServiceDetailsDialogProps> = ({
  open,
  onClose,
  serviceType,
}) => {
  const { t } = useTranslation();
  const { colors, isDarkMode, fontSize } = useTheme();
  
  const serviceData: Record<"cook" | "maid" | "babycare", ServiceDetails> = {
    maid: {
      title: t('serviceDetails.maid.title'),
      description: t('serviceDetails.maid.description'),
      icon: "🧹",
      features: [
        {
          title: t('serviceDetails.maid.features.cleaning.title'),
          items: [
            t('serviceDetails.maid.features.cleaning.items.0'),
            t('serviceDetails.maid.features.cleaning.items.1'),
            t('serviceDetails.maid.features.cleaning.items.2'),
            t('serviceDetails.maid.features.cleaning.items.3'),
            t('serviceDetails.maid.features.cleaning.items.4'),
            t('serviceDetails.maid.features.cleaning.items.5'),
          ],
        },
        {
          title: t('serviceDetails.maid.features.laundry.title'),
          items: [
            t('serviceDetails.maid.features.laundry.items.0'),
            t('serviceDetails.maid.features.laundry.items.1'),
            t('serviceDetails.maid.features.laundry.items.2'),
            t('serviceDetails.maid.features.laundry.items.3'),
          ],
        },
        {
          title: t('serviceDetails.maid.features.errands.title'),
          items: [
            t('serviceDetails.maid.features.errands.items.0'),
            t('serviceDetails.maid.features.errands.items.1'),
            t('serviceDetails.maid.features.errands.items.2'),
          ],
        },
        {
          items: [
            t('serviceDetails.maid.features.qualities.items.0'),
            t('serviceDetails.maid.features.qualities.items.1'),
            t('serviceDetails.maid.features.qualities.items.2'),
            t('serviceDetails.maid.features.qualities.items.3'),
          ],
        },
      ],
    },
    cook: {
      title: t('serviceDetails.cook.title'),
      description: t('serviceDetails.cook.description'),
      icon: "👩‍🍳",
      features: [
        {
          title: t('serviceDetails.cook.features.hygiene.title'),
          items: [
            t('serviceDetails.cook.features.hygiene.items.0'),
            t('serviceDetails.cook.features.hygiene.items.1'),
            t('serviceDetails.cook.features.hygiene.items.2'),
            t('serviceDetails.cook.features.hygiene.items.3'),
          ],
        },
        {
          title: t('serviceDetails.cook.features.temperature.title'),
          items: [
            t('serviceDetails.cook.features.temperature.items.0'),
            t('serviceDetails.cook.features.temperature.items.1'),
            t('serviceDetails.cook.features.temperature.items.2'),
          ],
        },
        {
          title: t('serviceDetails.cook.features.allergen.title'),
          items: [
            t('serviceDetails.cook.features.allergen.items.0'),
            t('serviceDetails.cook.features.allergen.items.1'),
            t('serviceDetails.cook.features.allergen.items.2'),
          ],
        },
        {
          title: t('serviceDetails.cook.features.handling.title'),
          items: [
            t('serviceDetails.cook.features.handling.items.0'),
            t('serviceDetails.cook.features.handling.items.1'),
          ],
        },
        {
          title: t('serviceDetails.cook.features.freshness.title'),
          items: [
            t('serviceDetails.cook.features.freshness.items.0'),
            t('serviceDetails.cook.features.freshness.items.1'),
          ],
        },
        {
          title: t('serviceDetails.cook.features.techniques.title'),
          items: [
            t('serviceDetails.cook.features.techniques.items.0'),
            t('serviceDetails.cook.features.techniques.items.1'),
            t('serviceDetails.cook.features.techniques.items.2'),
          ],
        },
        {
          title: t('serviceDetails.cook.features.detail.title'),
          items: [
            t('serviceDetails.cook.features.detail.items.0'),
            t('serviceDetails.cook.features.detail.items.1'),
            t('serviceDetails.cook.features.detail.items.2'),
          ],
        },
        {
          title: t('serviceDetails.cook.features.dietary.title'),
          items: [
            t('serviceDetails.cook.features.dietary.items.0'),
            t('serviceDetails.cook.features.dietary.items.1'),
            t('serviceDetails.cook.features.dietary.items.2'),
          ],
        },
        {
          title: t('serviceDetails.cook.features.customization.title'),
          items: [
            t('serviceDetails.cook.features.customization.items.0'),
            t('serviceDetails.cook.features.customization.items.1'),
            t('serviceDetails.cook.features.customization.items.2'),
          ],
        },
      ],
    },
    babycare: {
      title: t('serviceDetails.babycare.title'),
      description: t('serviceDetails.babycare.description'),
      icon: "👶",
      features: [
        {
          title: t('serviceDetails.babycare.features.nurture.title'),
          items: [
            t('serviceDetails.babycare.features.nurture.items.0'),
            t('serviceDetails.babycare.features.nurture.items.1'),
            t('serviceDetails.babycare.features.nurture.items.2'),
            t('serviceDetails.babycare.features.nurture.items.3'),
          ],
        },
        {
          title: t('serviceDetails.babycare.features.physical.title'),
          items: [
            t('serviceDetails.babycare.features.physical.items.0'),
            t('serviceDetails.babycare.features.physical.items.1'),
            t('serviceDetails.babycare.features.physical.items.2'),
          ],
        },
        {
          title: t('serviceDetails.babycare.features.medical.title'),
          items: [
            t('serviceDetails.babycare.features.medical.items.0'),
            t('serviceDetails.babycare.features.medical.items.1'),
          ],
        },
        {
          title: t('serviceDetails.babycare.features.cognitive.title'),
          items: [
            t('serviceDetails.babycare.features.cognitive.items.0'),
            t('serviceDetails.babycare.features.cognitive.items.1'),
            t('serviceDetails.babycare.features.cognitive.items.2'),
            t('serviceDetails.babycare.features.cognitive.items.3'),
            t('serviceDetails.babycare.features.cognitive.items.4'),
          ],
        },
        {
          title: t('serviceDetails.babycare.features.social.title'),
          items: [
            t('serviceDetails.babycare.features.social.items.0'),
            t('serviceDetails.babycare.features.social.items.1'),
            t('serviceDetails.babycare.features.social.items.2'),
            t('serviceDetails.babycare.features.social.items.3'),
          ],
        },
        {
          title: t('serviceDetails.babycare.features.physicalDev.title'),
          items: [
            t('serviceDetails.babycare.features.physicalDev.items.0'),
            t('serviceDetails.babycare.features.physicalDev.items.1'),
            t('serviceDetails.babycare.features.physicalDev.items.2'),
            t('serviceDetails.babycare.features.physicalDev.items.3'),
          ],
        },
        {
          title: t('serviceDetails.babycare.features.communication.title'),
          items: [
            t('serviceDetails.babycare.features.communication.items.0'),
            t('serviceDetails.babycare.features.communication.items.1'),
            t('serviceDetails.babycare.features.communication.items.2'),
            t('serviceDetails.babycare.features.communication.items.3'),
            t('serviceDetails.babycare.features.communication.items.4'),
          ],
        },
        {
          title: t('serviceDetails.babycare.features.collaboration.title'),
          items: [
            t('serviceDetails.babycare.features.collaboration.items.0'),
            t('serviceDetails.babycare.features.collaboration.items.1'),
            t('serviceDetails.babycare.features.collaboration.items.2'),
            t('serviceDetails.babycare.features.collaboration.items.3'),
          ],
        },
      ],
    },
  };

  if (!serviceType) return null;

  const { title, description, features, icon } = serviceData[serviceType];

  // Get font size based on theme settings
  const getFontSizes = () => {
    switch (fontSize) {
      case 'small':
        return {
          header: 14,
          description: 12,
          featureTitle: 13,
          listText: 12,
        };
      case 'large':
        return {
          header: 18,
          description: 16,
          featureTitle: 17,
          listText: 15,
        };
      default:
        return {
          header: 16,
          description: 14,
          featureTitle: 15,
          listText: 13,
        };
    }
  };

  const fontSizes = getFontSizes();

  const dynamicStyles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "flex-end",
    },
    backdropTouchable: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    dialog: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      width: "100%",
      maxHeight: "93%",
      overflow: "hidden",
      elevation: 24,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: 0.25,
      shadowRadius: 20,
    },
    handleBarContainer: {
      paddingTop: 12,
      paddingBottom: 8,
      alignItems: "center",
    },
    handleBar: {
      width: 48,
      height: 5,
      backgroundColor: isDarkMode ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.15)",
      borderRadius: 3,
    },
    header: {
      paddingTop: 20,
      paddingBottom: 24,
      paddingHorizontal: 24,
      minHeight: 120,
    },
    headerContent: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
    },
    headerLeft: {
      flex: 1,
      marginRight: 16,
    },
    iconContainer: {
      width: 64,
      height: 64,
      borderRadius: 20,
      backgroundColor: "rgba(255,255,255,0.25)",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    icon: {
      fontSize: 36,
    },
    headerTextContainer: {
      flex: 1,
    },
    headerText: {
      color: "#fff",
      fontWeight: "800",
      fontSize: fontSizes.header + 6,
      lineHeight: fontSizes.header + 12,
      letterSpacing: 0.5,
    },
    headerSubtext: {
      color: "rgba(255,255,255,0.9)",
      fontSize: fontSizes.description,
      marginTop: 4,
      fontWeight: "500",
    },
    closeButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: "rgba(255,255,255,0.25)",
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
    },
    content: {
      paddingHorizontal: 24,
      paddingTop: 8,
      paddingBottom: 40,
    },
    descriptionCard: {
      backgroundColor: isDarkMode ? "rgba(79, 143, 247, 0.08)" : "rgba(11, 91, 211, 0.06)",
      borderRadius: 16,
      padding: 20,
      marginBottom: 28,
      borderWidth: 1,
      borderColor: isDarkMode ? "rgba(79, 143, 247, 0.15)" : "rgba(11, 91, 211, 0.1)",
    },
    description: {
      fontSize: fontSizes.description + 1,
      color: colors.text,
      lineHeight: (fontSizes.description + 1) * 1.65,
      fontWeight: "500",
    },
    sectionTitle: {
      fontSize: fontSizes.featureTitle + 2,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 16,
      letterSpacing: 0.5,
    },
    featureBlock: {
      marginBottom: 20,
      backgroundColor: isDarkMode ? "rgba(255,255,255,0.04)" : "#f7f9fc",
      borderRadius: 16,
      padding: 18,
      borderWidth: 1,
      borderColor: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
    },
    featureTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
    },
    featureTitleIcon: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: colors.primary + "20",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    featureTitle: {
      fontWeight: "700",
      color: colors.primary,
      fontSize: fontSizes.featureTitle + 1,
      letterSpacing: 0.3,
      flex: 1,
    },
    listItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 14,
      paddingLeft: 2,
    },
    checkIconContainer: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primary + "18",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 14,
      marginTop: 1,
    },
    listText: {
      fontSize: fontSizes.listText + 1,
      color: colors.text,
      flexShrink: 1,
      lineHeight: (fontSizes.listText + 1) * 1.75,
      paddingRight: 4,
      fontWeight: "400",
    },
  });

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={dynamicStyles.backdropTouchable} onPress={onClose} />
      <View style={dynamicStyles.overlay}>
        <View style={dynamicStyles.dialog}>
          {/* Handle Bar for drag-down gesture indication */}
          <View style={dynamicStyles.handleBarContainer}>
            <View style={dynamicStyles.handleBar} />
          </View>

          {/* Header with Linear Gradient - Full Width & Professional */}
          <LinearGradient
            colors={["#0b5bd3", "#2e7de6", "#4f8ff7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={dynamicStyles.header}
          >
            <View style={dynamicStyles.headerContent}>
              <View style={dynamicStyles.headerLeft}>
                <View style={dynamicStyles.iconContainer}>
                  <Text style={dynamicStyles.icon}>{icon}</Text>
                </View>
                <View style={dynamicStyles.headerTextContainer}>
                  <Text style={dynamicStyles.headerText}>{title}</Text>
                  <Text style={dynamicStyles.headerSubtext}>Professional Service Standards</Text>
                </View>
              </View>
              <TouchableOpacity 
                onPress={onClose} 
                style={dynamicStyles.closeButton} 
                activeOpacity={0.8}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="x" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Content */}
          <ScrollView 
            style={dynamicStyles.content} 
            showsVerticalScrollIndicator={false}
            bounces={true}
          >
            {/* Description Card */}
            <View style={dynamicStyles.descriptionCard}>
              <Text style={dynamicStyles.description}>{description}</Text>
            </View>

            {/* Features Title */}
            <Text style={dynamicStyles.sectionTitle}>What We Offer</Text>

            {features.map((feature, index) => (
              <View key={index} style={dynamicStyles.featureBlock}>
                {feature.title && (
                  <View style={dynamicStyles.featureTitleRow}>
                    <View style={dynamicStyles.featureTitleIcon}>
                      <MaterialIcon name="star" size={16} color={colors.primary} />
                    </View>
                    <Text style={dynamicStyles.featureTitle}>{feature.title}</Text>
                  </View>
                )}
                {feature.items.map((item, i) => (
                  <View key={i} style={dynamicStyles.listItem}>
                    <View style={dynamicStyles.checkIconContainer}>
                      <MaterialIcon name="check" size={14} color={colors.primary} />
                    </View>
                    <Text style={dynamicStyles.listText}>{item}</Text>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default ServiceDetailsDialog;