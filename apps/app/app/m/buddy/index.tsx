import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BuddyModal } from '../../../src/modules/m07-buddy/BuddyModal';

export default function BuddyRoute() {
  return (
    <View style={styles.container}>
      <BuddyModal
        visible={true}
        eventId="evt-001"
        eventTitle="Underground Indie Cinema Night"
        onClose={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
});
