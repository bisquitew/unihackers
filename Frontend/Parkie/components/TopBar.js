import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme/colors';

export default function TopBar({ onSettingsPress }) {
  return (
    <View style={styles.topBar}>
      {/* Settings Button */}
      <TouchableOpacity 
        style={styles.settingsButton}
        onPress={onSettingsPress}
      >
        <Text style={styles.settingsIcon}>⚙️</Text>
      </TouchableOpacity>

      {/* Parkie Logo/Title */}
      <Text style={styles.logo}>Parkie</Text>

      {/* Placeholder for right alignment */}
      <View style={styles.placeholder} />
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.tertiary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingsButton: {
    padding: spacing.sm,
  },
  settingsIcon: {
    fontSize: 24,
  },
  logo: {
    fontSize: typography.title,
    fontWeight: 'bold',
    color: colors.primary,
  },
  placeholder: {
    width: 40,
  },
});
