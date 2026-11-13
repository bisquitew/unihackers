import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import mockData from '../shared/mockData.json';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'repara' | 'miroase' | 'transit' | 'buddy'>('home');
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Timișoara Hub</Text>
          <Text style={styles.headerSubtitle}>Community & City Fixer • UNIHACK 2026</Text>
        </View>
        <TouchableOpacity 
          style={styles.livingLabsPill}
          onPress={() => setShowFeedbackModal(!showFeedbackModal)}
        >
          <Text style={styles.livingLabsText}>★ Feedback</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content}>
        {activeTab === 'home' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What's happening in Timișoara</Text>

            {/* Transit Alert Card */}
            <View style={styles.cardAlert}>
              <Text style={styles.alertHeader}>⚠️ Transit Detours Active</Text>
              <Text style={styles.cardText}>Tram 5 is suspended on Calea Bogdăneștilor. Use bus 5C.</Text>
            </View>

            {/* Micro-Events */}
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Tonight's Micro-Events</Text>
            {mockData.events.map((evt) => (
              <View key={evt.id} style={styles.eventCard}>
                <Text style={styles.eventCategory}>{evt.category.toUpperCase()}</Text>
                <Text style={styles.eventTitle}>{evt.title}</Text>
                <Text style={styles.eventLocation}>📍 {evt.location_name}</Text>
                <Text style={styles.eventDescription}>{evt.description}</Text>
                <TouchableOpacity style={styles.buddyButton}>
                  <Text style={styles.buddyButtonText}>Cu Cine? (Find Event Buddy)</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'repara' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ReparaTM • Civic Reporting</Text>
            <Text style={styles.sectionSubtitle}>Take a photo of a pothole, broken streetlight or trash. Gemini AI triages automatically.</Text>
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>📷 Snap Photo & Report Issue</Text>
            </TouchableOpacity>

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Nearby Open Issues</Text>
            {mockData.issues.map((iss) => (
              <View key={iss.id} style={styles.issueCard}>
                <Text style={styles.issueHeader}>{iss.title}</Text>
                <Text style={styles.issueMeta}>{iss.category} • {iss.priority} priority • {iss.status}</Text>
                <Text style={styles.issueAddress}>📍 {iss.address}</Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'miroase' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MiroaseTM • Crowd Smell Map</Text>
            <Text style={styles.sectionSubtitle}>10-second report: What does it smell like right now?</Text>
            <View style={styles.smellButtonsRow}>
              {['Burnt Rubber', 'Chemical', 'Rotten', 'Smoke'].map((smell) => (
                <TouchableOpacity key={smell} style={styles.smellChip}>
                  <Text style={styles.smellChipText}>{smell}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => setActiveTab('home')} style={styles.navItem}>
          <Text style={[styles.navText, activeTab === 'home' && styles.navTextActive]}>City</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('repara')} style={styles.navItem}>
          <Text style={[styles.navText, activeTab === 'repara' && styles.navTextActive]}>ReparaTM</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('miroase')} style={styles.navItem}>
          <Text style={[styles.navText, activeTab === 'miroase' && styles.navTextActive]}>MiroaseTM</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#2d123d', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#ffffff', fontSize: 20, fontWeight: 'bold' },
  headerSubtitle: { color: '#a855f7', fontSize: 11 },
  livingLabsPill: { backgroundColor: '#8d23be', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  livingLabsText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  content: { flex: 1, padding: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
  sectionSubtitle: { color: '#9ca3af', fontSize: 13, marginBottom: 16 },
  cardAlert: { backgroundColor: '#2e1065', borderColor: '#7c3aed', borderWidth: 1, borderRadius: 12, padding: 14, marginVertical: 8 },
  alertHeader: { color: '#f59e0b', fontWeight: 'bold', fontSize: 14, marginBottom: 4 },
  cardText: { color: '#e9d5ff', fontSize: 13 },
  eventCard: { backgroundColor: '#18181b', borderColor: '#27272a', borderWidth: 1, borderRadius: 14, padding: 14, marginVertical: 8 },
  eventCategory: { color: '#c084fc', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  eventTitle: { color: '#ffffff', fontSize: 16, fontWeight: 'bold', marginTop: 4 },
  eventLocation: { color: '#a1a1aa', fontSize: 12, marginTop: 4 },
  eventDescription: { color: '#d4d4d8', fontSize: 13, marginTop: 6 },
  buddyButton: { marginTop: 12, backgroundColor: '#401056', borderColor: '#8d23be', borderWidth: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  buddyButtonText: { color: '#f3e8ff', fontSize: 12, fontWeight: '600' },
  actionButton: { backgroundColor: '#8d23be', padding: 14, borderRadius: 12, alignItems: 'center', marginVertical: 10 },
  actionButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  issueCard: { backgroundColor: '#18181b', padding: 12, borderRadius: 12, marginVertical: 6, borderWidth: 1, borderColor: '#27272a' },
  issueHeader: { color: '#ffffff', fontSize: 14, fontWeight: 'bold' },
  issueMeta: { color: '#a855f7', fontSize: 11, marginTop: 2 },
  issueAddress: { color: '#71717a', fontSize: 11, marginTop: 4 },
  smellButtonsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  smellChip: { backgroundColor: '#27272a', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20 },
  smellChipText: { color: '#f4f4f5', fontSize: 13, fontWeight: '500' },
  navBar: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#27272a', backgroundColor: '#09090b', paddingVertical: 12, justifyContent: 'space-around' },
  navItem: { alignItems: 'center' },
  navText: { color: '#71717a', fontSize: 12, fontWeight: '600' },
  navTextActive: { color: '#c084fc' },
});
