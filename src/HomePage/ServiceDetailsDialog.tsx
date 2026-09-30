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
      justifyContent: "center",
      alignItems: "center",
      padding: 20,
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
      borderRadius: 20,
      width: "100%",
      maxWidth: 420,
      maxHeight: "90%",
      overflow: "hidden",
      elevation: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
    },
    header: {
      flexDirection: "column",
      paddingTop: 28,
      paddingBottom: 28,
      paddingHorizontal: 24,
      minHeight: 100,
    },
    headerTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 4,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
      marginRight: 12,
    },
    iconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: "rgba(255,255,255,0.2)",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 16,
    },
    icon: {
      fontSize: 32,
    },
    headerTextContainer: {
      flex: 1,
    },
    headerText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: fontSizes.header + 4,
      lineHeight: fontSizes.header + 10,
      flexShrink: 1,
    },
    content: {
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 32,
    },
    descriptionCard: {
      backgroundColor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(11, 91, 211, 0.05)",
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    description: {
      fontSize: fontSizes.description + 1,
      color: colors.text,
      lineHeight: (fontSizes.description + 1) * 1.6,
      fontWeight: "500",
    },
    featureBlock: {
      marginBottom: 24,
      backgroundColor: isDarkMode ? "rgba(255,255,255,0.03)" : "#f8f9fa",
      borderRadius: 12,
      padding: 16,
    },
    featureTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 14,
    },
    featureTitleIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.primary + "20",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 10,
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
      marginBottom: 12,
      paddingLeft: 6,
    },
    checkIconContainer: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.primary + "15",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
      marginTop: 2,
    },
    listText: {
      fontSize: fontSizes.listText + 1,
      color: colors.text,
      flexShrink: 1,
      lineHeight: (fontSizes.listText + 1) * 1.7,
      paddingRight: 4,
      fontWeight: "400",
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(255,255,255,0.25)",
      justifyContent: "center",
      alignItems: "center",
    },
  });

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={dynamicStyles.backdropTouchable} onPress={onClose} />
      <View style={dynamicStyles.overlay}>
        <View style={dynamicStyles.dialog}>
          {/* Header with Linear Gradient - Full Width & Taller */}
          <LinearGradient
            colors={["#0b5bd3", "#4f8ff7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={dynamicStyles.header}
          >
            <View style={dynamicStyles.headerTop}>
              <View style={dynamicStyles.headerLeft}>
                <View style={dynamicStyles.iconContainer}>
                  <Text style={dynamicStyles.icon}>{icon}</Text>
                </View>
                <View style={dynamicStyles.headerTextContainer}>
                  <Text style={dynamicStyles.headerText}>{title}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={dynamicStyles.closeButton} activeOpacity={0.7}>
                <Icon name="x" size={26} color="#fff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Content */}
          <ScrollView style={dynamicStyles.content} showsVerticalScrollIndicator={false}>
            <View style={dynamicStyles.descriptionCard}>
              <Text style={dynamicStyles.description}>{description}</Text>
            </View>

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