import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { TicketBadge } from '../../../src/modules/m09-wallet/TicketBadge';

export default function WalletRoute() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Portofel Bilete & POAP</Text>
        <Text style={styles.sub}>Solana Devnet • Timișoara Culture Pass [M09]</Text>
      </View>

      <View style={styles.content}>
        <TicketBadge
          ticketId="tkt-sol-demo-001"
          eventTitle="Underground Indie Cinema Night"
          txSignature="4f8ZkQGj87kM1xRty9mPQvw48NmZ91VcLK2wP5RtxLpQvW981zNkLM8PQw91kVcLK2wP5RtxLpQvW981zNkLM8PQ"
          explorerUrl="https://explorer.solana.com/tx/4f8ZkQGj87kM1xRty9mPQvw48NmZ91VcLK2wP5RtxLpQvW981zNkLM8PQw91kVcLK2wP5RtxLpQvW981zNkLM8PQ?cluster=devnet"
          isCheckedIn={false}
        />

        <TicketBadge
          ticketId="tkt-sol-demo-002"
          eventTitle="Sunset Acoustic & Jazz Session"
          txSignature="3a1KxP92LmQv7N1z8KjM2xRty9mPQvw48NmZ91VcLK2wP5RtxLpQvW981zNkLM8PQw91kVcLK2wP5RtxLpQvW98"
          explorerUrl="https://explorer.solana.com/tx/3a1KxP92LmQv7N1z8KjM2xRty9mPQvw48NmZ91VcLK2wP5RtxLpQvW981zNkLM8PQw91kVcLK2wP5RtxLpQvW98?cluster=devnet"
          isCheckedIn={true}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#27272a' },
  title: { color: '#ffffff', fontSize: 20, fontWeight: 'bold' },
  sub: { color: '#a1a1aa', fontSize: 12, marginTop: 4 },
  content: { padding: 16 },
});
