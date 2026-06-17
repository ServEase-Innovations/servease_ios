import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useTheme } from "../../Settings/ThemeContext";
import {
  AVAILABILITY_MAX_MINUTES,
  AVAILABILITY_MIN_MINUTES,
  AVAILABILITY_PRESETS,
  AvailabilitySlot,
  createSlotId,
  formatMinutesDisplay,
  formatSlotsSummary,
  FULL_DAY_TIMESLOT,
  generateTimeOptions,
  isDuplicateSlot,
  parseTimeslotString,
  slotsToTimeslotString,
} from "./availabilityUtils";

type AvailabilityMode = "full" | "custom";

type AvailabilityPickerProps = {
  value?: string;
  onChange: (timeslot: string) => void;
};

type PickerTarget = {
  slotId: string;
  field: "start" | "end";
};

const DEFAULT_CUSTOM_SLOT: Omit<AvailabilitySlot, "id"> = {
  startMinutes: 9 * 60,
  endMinutes: 17 * 60,
};

const AvailabilityPicker: React.FC<AvailabilityPickerProps> = ({ value, onChange }) => {
  const { colors, fontSize } = useTheme();
  const fontSizes = fontSize ?? { heading: 16, text: 14, label: 13, small: 12, button: 14 };
  const initialState = useMemo(() => parseTimeslotString(value), []);

  const [mode, setMode] = useState<AvailabilityMode>(initialState.mode);
  const [slots, setSlots] = useState<AvailabilitySlot[]>(initialState.slots);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget | null>(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const timeOptions = useMemo(() => generateTimeOptions(), []);

  useEffect(() => {
    if (mode === "full") {
      onChangeRef.current(FULL_DAY_TIMESLOT);
      return;
    }
    const validSlots = slots.filter((slot) => slot.endMinutes > slot.startMinutes);
    onChangeRef.current(validSlots.length ? slotsToTimeslotString(validSlots) : "");
  }, [mode, slots]);

  const switchMode = (nextMode: AvailabilityMode) => {
    setMode(nextMode);
    setShowDuplicateWarning(false);
    if (nextMode === "custom" && slots.length === 0) {
      setSlots([{ id: createSlotId(), ...DEFAULT_CUSTOM_SLOT }]);
    }
  };

  const addSlot = () => {
    setSlots((prev) => [...prev, { id: createSlotId(), ...DEFAULT_CUSTOM_SLOT }]);
  };

  const removeSlot = (slotId: string) => {
    setSlots((prev) => prev.filter((slot) => slot.id !== slotId));
    setShowDuplicateWarning(false);
  };

  const applyPreset = (startMinutes: number, endMinutes: number) => {
    const candidate: AvailabilitySlot = {
      id: createSlotId(),
      startMinutes,
      endMinutes,
    };
    setSlots((prev) => {
      if (isDuplicateSlot(prev, candidate)) {
        setShowDuplicateWarning(true);
        return prev;
      }
      setShowDuplicateWarning(false);
      return [...prev, candidate];
    });
    setMode("custom");
  };

  const updateSlot = (slotId: string, patch: Partial<AvailabilitySlot>) => {
    setSlots((prev) =>
      prev.map((slot) => {
        if (slot.id !== slotId) return slot;
        const next = { ...slot, ...patch };
        if (next.endMinutes <= next.startMinutes) {
          next.endMinutes = Math.min(
            AVAILABILITY_MAX_MINUTES,
            next.startMinutes + 60
          );
        }
        return next;
      })
    );
    setShowDuplicateWarning(false);
  };

  const openPicker = (slotId: string, field: "start" | "end") => {
    setPickerTarget({ slotId, field });
  };

  const activeSlot = pickerTarget
    ? slots.find((slot) => slot.id === pickerTarget.slotId)
    : null;

  const pickerOptions =
    pickerTarget && activeSlot
      ? pickerTarget.field === "start"
        ? timeOptions.filter((minutes) => minutes < AVAILABILITY_MAX_MINUTES)
        : timeOptions.filter((minutes) => minutes > activeSlot.startMinutes)
      : [];

  const summary =
    mode === "full"
      ? `${formatMinutesDisplay(AVAILABILITY_MIN_MINUTES)} - ${formatMinutesDisplay(AVAILABILITY_MAX_MINUTES)}`
      : formatSlotsSummary(slots.filter((slot) => slot.endMinutes > slot.startMinutes));

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.primary, fontSize: fontSizes.heading }]}>
        AVAILABILITY
      </Text>

      <View style={[styles.modeRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.modeButton,
            mode === "full" && { backgroundColor: colors.primary },
          ]}
          onPress={() => switchMode("full")}
        >
          <Icon name="schedule" size={18} color={mode === "full" ? "#fff" : colors.textSecondary} />
          <Text
            style={[
              styles.modeButtonText,
              { color: mode === "full" ? "#fff" : colors.text, fontSize: fontSizes.text },
            ]}
          >
            Full Day
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.modeButton,
            mode === "custom" && { backgroundColor: colors.primary },
          ]}
          onPress={() => switchMode("custom")}
        >
          <Icon name="tune" size={18} color={mode === "custom" ? "#fff" : colors.textSecondary} />
          <Text
            style={[
              styles.modeButtonText,
              { color: mode === "custom" ? "#fff" : colors.text, fontSize: fontSizes.text },
            ]}
          >
            Custom
          </Text>
        </TouchableOpacity>
      </View>

      {mode === "full" ? (
        <View style={[styles.fullDayBanner, { backgroundColor: colors.infoLight, borderColor: colors.primary }]}>
          <Icon name="check-circle" size={22} color={colors.primary} />
          <View style={styles.fullDayTextWrap}>
            <Text style={[styles.fullDayTitle, { color: colors.text, fontSize: fontSizes.text }]}>
              Available all day
            </Text>
            <Text style={[styles.fullDaySub, { color: colors.textSecondary, fontSize: fontSizes.small }]}>
              {formatMinutesDisplay(AVAILABILITY_MIN_MINUTES)} to {formatMinutesDisplay(AVAILABILITY_MAX_MINUTES)}
            </Text>
          </View>
        </View>
      ) : (
        <>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary, fontSize: fontSizes.small }]}>
            Quick add
          </Text>
          <View style={styles.presetRow}>
            {AVAILABILITY_PRESETS.map((preset) => (
              <TouchableOpacity
                key={preset.id}
                style={[styles.presetChip, { borderColor: colors.border, backgroundColor: colors.surface }]}
                onPress={() => applyPreset(preset.startMinutes, preset.endMinutes)}
              >
                <Text style={[styles.presetChipText, { color: colors.primary, fontSize: fontSizes.small }]}>
                  {preset.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {showDuplicateWarning ? (
            <Text style={[styles.errorText, { color: colors.error || "#f44336", fontSize: fontSizes.small }]}>
              This time slot is already added
            </Text>
          ) : null}

          {slots.map((slot, index) => (
            <View
              key={slot.id}
              style={[styles.slotCard, { borderColor: colors.border, backgroundColor: colors.surface }]}
            >
              <View style={styles.slotHeader}>
                <Text style={[styles.slotTitle, { color: colors.text, fontSize: fontSizes.text }]}>
                  Slot {index + 1}
                </Text>
                {slots.length > 1 ? (
                  <TouchableOpacity onPress={() => removeSlot(slot.id)} hitSlop={8}>
                    <Icon name="close" size={20} color={colors.error || "#f44336"} />
                  </TouchableOpacity>
                ) : null}
              </View>

              <View style={styles.timeRow}>
                <View style={styles.timeField}>
                  <Text style={[styles.timeLabel, { color: colors.textSecondary, fontSize: fontSizes.small }]}>
                    Start
                  </Text>
                  <TouchableOpacity
                    style={[styles.timeButton, { borderColor: colors.border, backgroundColor: colors.card }]}
                    onPress={() => openPicker(slot.id, "start")}
                  >
                    <Text style={[styles.timeButtonText, { color: colors.text, fontSize: fontSizes.text }]}>
                      {formatMinutesDisplay(slot.startMinutes)}
                    </Text>
                    <Icon name="arrow-drop-down" size={22} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <Icon name="arrow-forward" size={18} color={colors.textSecondary} style={styles.timeArrow} />

                <View style={styles.timeField}>
                  <Text style={[styles.timeLabel, { color: colors.textSecondary, fontSize: fontSizes.small }]}>
                    End
                  </Text>
                  <TouchableOpacity
                    style={[styles.timeButton, { borderColor: colors.border, backgroundColor: colors.card }]}
                    onPress={() => openPicker(slot.id, "end")}
                  >
                    <Text style={[styles.timeButtonText, { color: colors.text, fontSize: fontSizes.text }]}>
                      {formatMinutesDisplay(slot.endMinutes)}
                    </Text>
                    <Icon name="arrow-drop-down" size={22} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={[styles.addButton, { borderColor: colors.primary }]}
            onPress={addSlot}
          >
            <Icon name="add" size={20} color={colors.primary} />
            <Text style={[styles.addButtonText, { color: colors.primary, fontSize: fontSizes.button }]}>
              Add time slot
            </Text>
          </TouchableOpacity>
        </>
      )}

      {summary ? (
        <View style={[styles.summary, { backgroundColor: colors.infoLight }]}>
          <Text style={[styles.summaryLabel, { color: colors.primary, fontSize: fontSizes.small }]}>
            Your availability
          </Text>
          <Text style={[styles.summaryText, { color: colors.text, fontSize: fontSizes.text }]}>
            {summary}
          </Text>
        </View>
      ) : null}

      <Modal
        visible={pickerTarget !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerTarget(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setPickerTarget(null)}>
          <Pressable style={[styles.modalSheet, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text, fontSize: fontSizes.heading }]}>
                Select {pickerTarget?.field === "start" ? "start" : "end"} time
              </Text>
              <TouchableOpacity onPress={() => setPickerTarget(null)}>
                <Icon name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.timeList} keyboardShouldPersistTaps="handled">
              {pickerOptions.map((minutes) => {
                const isSelected =
                  activeSlot &&
                  (pickerTarget?.field === "start"
                    ? activeSlot.startMinutes === minutes
                    : activeSlot.endMinutes === minutes);
                return (
                  <TouchableOpacity
                    key={minutes}
                    style={[
                      styles.timeOption,
                      { borderBottomColor: colors.border },
                      isSelected && { backgroundColor: colors.infoLight },
                    ]}
                    onPress={() => {
                      if (!pickerTarget) return;
                      if (pickerTarget.field === "start") {
                        updateSlot(pickerTarget.slotId, { startMinutes: minutes });
                      } else {
                        updateSlot(pickerTarget.slotId, { endMinutes: minutes });
                      }
                      setPickerTarget(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.timeOptionText,
                        {
                          color: isSelected ? colors.primary : colors.text,
                          fontSize: fontSizes.text,
                          fontWeight: isSelected ? "700" : "500",
                        },
                      ]}
                    >
                      {formatMinutesDisplay(minutes)}
                    </Text>
                    {isSelected ? <Icon name="check" size={20} color={colors.primary} /> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  title: {
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  modeRow: {
    flexDirection: "row",
    borderRadius: 10,
    borderWidth: 1,
    padding: 4,
    gap: 6,
    marginBottom: 14,
  },
  modeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modeButtonText: {
    fontWeight: "600",
  },
  fullDayBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
  },
  fullDayTextWrap: {
    flex: 1,
  },
  fullDayTitle: {
    fontWeight: "600",
  },
  fullDaySub: {
    marginTop: 2,
  },
  sectionLabel: {
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  presetChip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  presetChipText: {
    fontWeight: "600",
  },
  slotCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  slotHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  slotTitle: {
    fontWeight: "600",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  timeField: {
    flex: 1,
  },
  timeLabel: {
    marginBottom: 4,
    fontWeight: "500",
  },
  timeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  timeButtonText: {
    fontWeight: "500",
  },
  timeArrow: {
    marginBottom: 12,
  },
  errorText: {
    marginTop: 8,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 4,
  },
  addButtonText: {
    fontWeight: "600",
  },
  summary: {
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
  },
  summaryLabel: {
    fontWeight: "700",
    marginBottom: 4,
  },
  summaryText: {
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "55%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontWeight: "700",
    flex: 1,
  },
  timeList: {
    maxHeight: 360,
  },
  timeOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  timeOptionText: {},
});

export default AvailabilityPicker;
