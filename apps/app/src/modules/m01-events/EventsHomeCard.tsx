import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';

export function EventsHomeCard({ onExplorePress }: { onExplorePress?: () => void }) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.badge}>🎭 CULTURĂ ÎN TIMIȘOARA</Text>
        <Text style={styles.time}>În această seară</Text>
      </View>
      <Text style={styles.title}>Underground Indie Cinema Night</Text>
      <Text style={styles.venue}>📍 Faber Community Yard • 19:30</Text>
      <Text style={styles.desc}>Scurtmetraje românești independente și ceai cald.</Text>
      <TouchableOpacity style={styles.button} onPress={onExplorePress}>
        <Text style={styles.buttonText}>Descoperă Evenimente & Bilete Solana →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#18181b',
    borderWidth: 1,
    borderColor: '#3b0764',
    borderRadius: 14,
    padding: 16,
    marginVertical: 8,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { color: '#c084fc', fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
  time: { color: '#a1a1aa', fontSize: 11 },
  title: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', marginTop: 6 },
  venue: { color: '#e4e4e7', fontSize: 12, marginTop: 4, fontWeight: '500' },
  desc: { color: '#a1a1aa', fontSize: 12, marginTop: 4 },
  button: {
    marginTop: 12,
    backgroundColor: '#2e1065',
    borderColor: '#7e22ce',
    borderWidth: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#e9d5ff', fontSize: 12, fontWeight: '600' },
});
