import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { colors, spacing, typography } from '../theme/colors';

export default function BottomNavBar({ onNavigationPress, onTalkPress }) {
  return (
    <View style={styles.navBar}>
      {/* Navigation Button */}
      <TouchableOpacity 
        style={styles.navButton}
        onPress={onNavigationPress}
      >
        <Text style={styles.icon}>📍</Text>
        <Text style={styles.label}>Navigate</Text>
      </TouchableOpacity>

      {/* Talk Button */}
      <TouchableOpacity 
        style={styles.navButton}
        onPress={onTalkPress}
      >
        <Text style={styles.icon}>🎤</Text>
        <Text style={styles.label}>Talk</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: colors.tertiary,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  navButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  icon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: typography.small,
    color: colors.secondary,
    fontWeight: '600',
  },
});
