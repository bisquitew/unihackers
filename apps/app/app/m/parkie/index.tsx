import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { darkHeader } from '../../../src/modules/m06-smell/header';

export default function ParkiePreviewRoute() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={darkHeader('Parkie Smart Parking')} />
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.icon}>🅿️</Text>
          <Text style={styles.title}>Parkie Smart Parking</Text>
          <Text style={styles.statusBadge}>MODUL ÎN CURS DE INTEGRARE</Text>
          <Text style={styles.description}>
            Motorul inteligent de detecție video și monitorizare a locurilor libere este activ în backend (`/v1/m/parkie/lots` și fluxul live SSE `/v1/m/parkie/stream`).
          </Text>
          <Text style={styles.detail}>
            Interfața mobilă completă va fi activată în etapa următoare.
          </Text>
          <TouchableOpacity style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Înapoi la Ecranul Principal</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090b',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#18181b',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#27272a',
    maxWidth: 380,
    width: '100%',
  },
  icon: {
    fontSize: 48,
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  statusBadge: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  description: {
    fontSize: 14,
    color: '#a1a1aa',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  detail: {
    fontSize: 12,
    color: '#71717a',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#27272a',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
