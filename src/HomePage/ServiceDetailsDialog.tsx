/* eslint-disable */
import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
      backgroundColor: "rgba(0,0,0,0.4)",
      justifyContent: "center",
      alignItems: "center",
    },
    dialog: {
      backgroundColor: colors.card,
      borderRadius: 12,
      width: 340,
      maxHeight: "80%",
      overflow: "hidden",
      elevation: 10,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
    },
    icon: {
      fontSize: 20,
      marginRight: 8,
    },
    headerText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: fontSizes.header,
    },
    content: {
      padding: 16,
    },
    description: {
      fontSize: fontSizes.description,
      color: colors.textSecondary,
      marginBottom: 16,
    },
    featureBlock: {
      marginBottom: 20,
    },
    featureTitle: {
      fontWeight: "bold",
      color: colors.primary,
      marginBottom: 8,
      fontSize: fontSizes.featureTitle,
    },
    listItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: 6,
    },
    listText: {
      fontSize: fontSizes.listText,
      color: colors.text,
      flexShrink: 1,
    },
    divider: {
      height: 1,
      backgroundColor: colors.borderLight,
      marginTop: 10,
    },
  });

  return (
    <Modal visible={open} transparent animationType="fade">
      <View style={dynamicStyles.overlay}>
        <View style={dynamicStyles.dialog}>
          {/* Header with Linear Gradient */}
          <LinearGradient
            colors={["#0a2a66ff", "#004aadff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={dynamicStyles.header}
          >
            <View style={dynamicStyles.headerLeft}>
              <Text style={dynamicStyles.icon}>{icon}</Text>
              <Text style={dynamicStyles.headerText}>{title}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Icon name="x" size={24} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          {/* Content */}
          <ScrollView style={dynamicStyles.content}>
            <Text style={dynamicStyles.description}>{description}</Text>

            {features.map((feature, index) => (
              <View key={index} style={dynamicStyles.featureBlock}>
                {feature.title && (
                  <Text style={dynamicStyles.featureTitle}>{feature.title}</Text>
                )}
                {feature.items.map((item, i) => (
                  <View key={i} style={dynamicStyles.listItem}>
                    <MaterialIcon
                      name="check"
                      size={16}
                      color={colors.primary}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={dynamicStyles.listText}>{item}</Text>
                  </View>
                ))}
                {index < features.length - 1 && (
                  <View style={dynamicStyles.divider} />
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default ServiceDetailsDialog;