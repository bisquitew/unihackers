import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import TopBar from '../components/TopBar';
import MapPlaceholder from '../components/MapPlaceholder';
import ParkingCard from '../components/ParkingCard';
import BottomNavBar from '../components/BottomNavBar';
import { colors } from '../theme/colors';

export default function HomeScreen() {
  const [selectedParking, setSelectedParking] = useState(null);
  const [cardVisible, setCardVisible] = useState(false);

  // Sample parking data - Replace with API call later
  const sampleParkings = [
    {
      id: '1',
      name: 'Downtown Garage',
      available: 24,
      occupied: 76,
      status: 'red',
    },
    {
      id: '2',
      name: 'West Side Parking',
      available: 45,
      occupied: 55,
      status: 'yellow',
    },
    {
      id: '3',
      name: 'North Street Lot',
      available: 120,
      occupied: 30,
      status: 'green',
    },
  ];

  const handleMapPress = () => {
    // For now, show a random parking lot
    const randomIndex = Math.floor(Math.random() * sampleParkings.length);
    setSelectedParking(sampleParkings[randomIndex]);
    setCardVisible(true);
  };

  const handleCardClose = () => {
    setCardVisible(false);
  };

  const handleSettingsPress = () => {
    Alert.alert('Settings', 'Settings page coming soon!');
  };

  const handleNavigationPress = () => {
    Alert.alert('Navigate', 'Navigation feature coming soon!');
  };

  const handleTalkPress = () => {
    Alert.alert('Talk', 'Voice feature coming soon!');
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <TopBar onSettingsPress={handleSettingsPress} />

      {/* Main Content */}
      <MapPlaceholder onMapPress={handleMapPress} />

      {/* Parking Card Overlay */}
      <ParkingCard 
        visible={cardVisible}
        parking={selectedParking}
        onClose={handleCardClose}
      />

      {/* Bottom Navigation Bar */}
      <BottomNavBar 
        onNavigationPress={handleNavigationPress}
        onTalkPress={handleTalkPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },
});
