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
      title: "Cleaning help",
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
      title: "Cook",
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
      title: "Caregiver",
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
      backgroundColor: "rgba(0,0,0,0.45)",
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
      borderTopLeftRadius: 36,
      borderTopRightRadius: 36,
      width: "100%",
      maxHeight: "92%",
      overflow: "hidden",
      elevation: 24,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -8 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
    },
    handleBarContainer: {
      paddingTop: 16,
      paddingBottom: 16,
      alignItems: "center",
      backgroundColor: colors.card,
      borderTopLeftRadius: 36,
      borderTopRightRadius: 36,
      zIndex: 10,
    },
    handleBar: {
      width: 50,
      height: 6,
      backgroundColor: isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)",
      borderRadius: 4,
    },
    header: {
      paddingTop: 10,
      paddingBottom: 30,
      paddingHorizontal: 28,
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
      width: 72,
      height: 72,
      borderRadius: 24,
      backgroundColor: "rgba(255,255,255,0.3)",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.4)",
    },
    icon: {
      fontSize: 40,
    },
    headerTextContainer: {
      marginTop: 4,
    },
    headerText: {
      color: "#fff",
      fontWeight: "800",
      fontSize: fontSizes.header + 8,
      lineHeight: fontSizes.header + 14,
      letterSpacing: 0.5,
    },
    headerSubtext: {
      color: "rgba(255,255,255,0.85)",
      fontSize: fontSizes.description,
      marginTop: 6,
      fontWeight: "600",
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },
    closeButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: "rgba(255,255,255,0.2)",
      justifyContent: "center",
      alignItems: "center",
    },
    content: {
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 50,
    },
    descriptionCard: {
      backgroundColor: isDarkMode ? "rgba(79, 143, 247, 0.1)" : "#f0f5ff",
      borderRadius: 20,
      padding: 24,
      marginBottom: 32,
      borderWidth: 1,
      borderColor: isDarkMode ? "rgba(79, 143, 247, 0.2)" : "#d6e4ff",
    },
    description: {
      fontSize: fontSizes.description + 1,
      color: isDarkMode ? "#e6f0ff" : "#1a365d",
      lineHeight: (fontSizes.description + 1) * 1.6,
      fontWeight: "500",
    },
    sectionTitleContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: fontSizes.featureTitle + 4,
      fontWeight: "800",
      color: colors.text,
      letterSpacing: 0.5,
      marginLeft: 8,
    },
    featureBlock: {
      marginBottom: 24,
      backgroundColor: isDarkMode ? "#1e1e1e" : "#ffffff",
      borderRadius: 20,
      padding: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 10,
      elevation: 3,
      borderWidth: 1,
      borderColor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.02)",
    },
    featureTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
    },
    featureTitleIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: colors.primary + "15",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    featureTitle: {
      fontWeight: "700",
      color: colors.text,
      fontSize: fontSizes.featureTitle + 2,
      letterSpacing: 0.3,
      flex: 1,
    },
    listItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 16,
      paddingRight: 10,
    },
    checkIconContainer: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: colors.primary + "15",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
      marginTop: 2,
    },
    listText: {
      fontSize: fontSizes.listText + 1,
      color: isDarkMode ? "#cccccc" : "#4a5568",
      flexShrink: 1,
      lineHeight: (fontSizes.listText + 1) * 1.6,
      fontWeight: "500",
    },
    gradientHeader: {
      borderTopLeftRadius: 36,
      borderTopRightRadius: 36,
      overflow: "hidden",
    }
  });

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={dynamicStyles.backdropTouchable} onPress={onClose} />
      <View style={dynamicStyles.overlay}>
        <View style={dynamicStyles.dialog}>
          <LinearGradient
            colors={isDarkMode ? ["#1a365d", "#0b5bd3", "#2e7de6"] : ["#0b5bd3", "#2e7de6", "#4f8ff7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={dynamicStyles.gradientHeader}
          >
            {/* Handle Bar inside gradient for cohesive look */}
            <View style={[dynamicStyles.handleBarContainer, { backgroundColor: 'transparent' }]}>
              <View style={dynamicStyles.handleBar} />
            </View>

            <View style={dynamicStyles.header}>
              <View style={dynamicStyles.headerContent}>
                <View style={dynamicStyles.headerLeft}>
                  <View style={dynamicStyles.iconContainer}>
                    <Text style={dynamicStyles.icon}>{icon}</Text>
                  </View>
                  <View style={dynamicStyles.headerTextContainer}>
                    <Text style={dynamicStyles.headerText}>{title}</Text>
                    <Text style={dynamicStyles.headerSubtext}>Professional Standard</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  onPress={onClose} 
                  style={dynamicStyles.closeButton} 
                  activeOpacity={0.7}
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                >
                  <Icon name="x" size={22} color="#fff" />
                </TouchableOpacity>
              </View>
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
            <View style={dynamicStyles.sectionTitleContainer}>
              <Icon name="award" size={22} color={colors.primary} />
              <Text style={dynamicStyles.sectionTitle}>What We Offer</Text>
            </View>

            {features.map((feature, index) => (
              <View key={index} style={dynamicStyles.featureBlock}>
                {feature.title && (
                  <View style={dynamicStyles.featureTitleRow}>
                    <View style={dynamicStyles.featureTitleIcon}>
                      <Icon name="check-circle" size={18} color={colors.primary} />
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
            
            {/* Bottom padding for scroll */}
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default ServiceDetailsDialog;