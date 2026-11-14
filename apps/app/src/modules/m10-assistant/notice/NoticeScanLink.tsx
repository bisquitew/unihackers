// Small entry point to the notice scanner, for P2's Utilities screen.
import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export function NoticeScanLink() {
  const router = useRouter();
  return (
    <TouchableOpacity style={styles.link} onPress={() => router.push('/m/notice' as never)} accessibilityRole="link" accessibilityLabel="Scanează un anunț cu Gemini">
      <Text style={styles.text}>📷 Ai văzut un anunț pe ușa blocului? Scanează-l</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  link: { borderColor: '#a855f7', borderWidth: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, marginTop: 12, alignSelf: 'flex-start' },
  text: { color: '#c084fc', fontSize: 14, fontWeight: '600' },
});
