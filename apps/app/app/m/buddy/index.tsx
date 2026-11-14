import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BuddyScreen } from '../../../src/modules/m07-buddy/BuddyScreen';

export default function BuddyRoute() {
  return (
    <View style={styles.container}>
      <BuddyScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
});
