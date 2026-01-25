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
  const serviceData: Record<"cook" | "maid" | "babycare", ServiceDetails> = {
    maid: {
      title: "ServEaso Maid Services",
      description: "Professional cleaning and household services",
      icon: "🧹",
      features: [
        {
          title: "Cleaning",
          items: [
            "Utensils cleaning",
            "Dusting",
            "Vacuuming",
            "Mopping",
            "Sweeping",
            "Cleaning bathrooms and kitchens",
          ],
        },
        {
          title: "Laundry",
          items: [
            "Washing clothes",
            "Drying clothes",
            "Folding clothes",
            "Ironing clothes",
          ],
        },
        {
          title: "Errands",
          items: [
            "Running errands for customers",
            "Picking up groceries",
            "Dry cleaning pickup/dropoff",
          ],
        },
        {
          items: [
            "Respectful of customer's property",
            "Punctual and reliable",
            "Professional and courteous",
            "Discreet and respectful of privacy",
          ],
        },
      ],
    },
    cook: {
      title: "ServEaso Cook Services",
      description: "Professional cooking services with strict standards",
      icon: "👩‍🍳",
      features: [
        {
          title: "Hygiene",
          items: [
            "Adhere to strict hygiene standards",
            "Frequent handwashing",
            "Wear clean uniforms and hairnets",
            "Maintain spotless work environment",
          ],
        },
        {
          title: "Temperature Control",
          items: [
            "Meticulously monitor food temperatures",
            "Prevent bacterial growth",
            "Ensure proper cooking, storage, and reheating",
          ],
        },
        {
          title: "Allergen Awareness",
          items: [
            "Handle allergens carefully",
            "Prevent cross-contamination",
            "Provide accurate allergen information",
          ],
        },
        {
          title: "Safe Food Handling",
          items: [
            "Follow proper procedures for raw and cooked foods",
            "Minimize contamination risk",
          ],
        },
        {
          title: "Freshness",
          items: [
            "Use fresh, high-quality ingredients",
            "Select best produce, meats, and components",
          ],
        },
        {
          title: "Proper Techniques",
          items: [
            "Employ proper cooking techniques",
            "Maximize flavor, texture, and nutritional value",
            "Ensure highest preparation standards",
          ],
        },
        {
          title: "Attention to Detail",
          items: [
            "Pay close attention to every step",
            "From chopping vegetables to final plating",
            "Ensure consistency and visual appeal",
          ],
        },
        {
          title: "Dietary Restrictions",
          items: [
            "Accommodate gluten-free needs",
            "Prepare vegetarian and vegan meals",
            "Tailor to specific allergies/intolerances",
          ],
        },
        {
          title: "Customization",
          items: [
            "Adjust spice levels",
            "Modify ingredients",
            "Customize portion sizes",
          ],
        },
      ],
    },
    babycare: {
      title: "ServEaso Caregiver Services",
      description: "Professional child care services",
      icon: "👶",
      features: [
        {
          title: "Nurture and Safe Environment",
          items: [
            "Provide loving and supportive environment",
            "Children feel safe, secure, and understood",
            "Offer comfort and encouragement",
            "Build strong emotional connection",
          ],
        },
        {
          title: "Physical Safety",
          items: [
            "Ensure hazard-free environment",
            "Supervise all activities",
            "Prepare for emergencies",
          ],
        },
        {
          title: "Medical Safety",
          items: ["Trained in CPR", "First aid certified for medical emergencies"],
        },
        {
          title: "Cognitive Development",
          items: [
            "Engage in age-appropriate activities",
            "Reading and educational games",
            "Explore children's interests",
            "Help with homework",
            "Encourage learning",
          ],
        },
        {
          title: "Social/Emotional Development",
          items: [
            "Teach sharing and empathy",
            "Conflict resolution skills",
            "Develop self-confidence",
            "Build emotional intelligence",
          ],
        },
        {
          title: "Physical Development",
          items: [
            "Encourage physical activity",
            "Outdoor adventures",
            "Age-appropriate sports",
            "Prepare healthy meals and snacks",
          ],
        },
        {
          title: "Communication",
          items: [
            "Maintain open communication with parents",
            "Share daily updates",
            "Discuss development progress",
            "Listen attentively to child",
            "Respond with empathy",
          ],
        },
        {
          title: "Collaboration",
          items: [
            "Work in partnership with parents",
            "Ensure consistency in care",
            "Respect parents' values",
            "Follow parenting styles",
          ],
        },
      ],
    },
  };

  if (!serviceType) return null;

  const { title, description, features, icon } = serviceData[serviceType];

  return (
    <Modal visible={open} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.icon}>{icon}</Text>
              <Text style={styles.headerText}>{title}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Icon name="x" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content}>
            <Text style={styles.description}>{description}</Text>

            {features.map((feature, index) => (
              <View key={index} style={styles.featureBlock}>
                {feature.title && (
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                )}
                {feature.items.map((item, i) => (
                  <View key={i} style={styles.listItem}>
                    <MaterialIcon
                      name="check"
                      size={16}
                      color="#1d4ed8"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.listText}>{item}</Text>
                  </View>
                ))}
                {index < features.length - 1 && (
                  <View style={styles.divider} />
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  dialog: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: 340,
    maxHeight: "80%",
    overflow: "hidden",
    elevation: 10,
  },
  header: {
    backgroundColor: "#1d4ed8",
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
    fontSize: 16,
  },
  content: {
    padding: 16,
  },
  description: {
    fontSize: 14,
    color: "#333",
    marginBottom: 16,
  },
  featureBlock: {
    marginBottom: 20,
  },
  featureTitle: {
    fontWeight: "bold",
    color: "#1d4ed8",
    marginBottom: 8,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  listText: {
    fontSize: 13,
    color: "#444",
    flexShrink: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.08)",
    marginTop: 10,
  },
});

export default ServiceDetailsDialog;
