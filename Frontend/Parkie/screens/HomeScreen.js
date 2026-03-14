import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, StatusBar, SafeAreaView } from 'react-native';
import TopBar from '../components/TopBar';
import GoogleMaps from '../components/GoogleMaps';
import ParkingCard from '../components/ParkingCard';
import BottomNavBar from '../components/BottomNavBar';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { colors } from '../theme/colors';
import { apiService } from '../lib/api';
import { transformLotsData, transformLotData } from '../lib/dataTransformer';
import { API_CONFIG } from '../config/api';
import { supabase } from '../lib/supabase';

export default function HomeScreen() {
  const [parkingLots, setParkingLots] = useState([]);
  const [selectedParking, setSelectedParking] = useState(null);
  const [cardVisible, setCardVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchParkingLots = async () => {
    try {
      const response = await apiService.fetchAllLots();
      if (Array.isArray(response)) {
        const transformedLots = transformLotsData(response);
        setParkingLots(transformedLots);
        setError(null);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      setError(err?.message || 'Failed to load parking data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParkingLots();

    // Subscribe to realtime updates for the parking_lots table
    const subscription = supabase
      .channel('parking-lots-updates')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'parking_lots',
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            const updatedLot = transformLotData(payload.new);
            setParkingLots((prevLots) =>
              prevLots.map((lot) => (lot.id === updatedLot.id ? updatedLot : lot))
            );
            
            // If the selected lot was updated, update its state too
            setSelectedParking((prevSelected) => {
              if (prevSelected && prevSelected.id === updatedLot.id) {
                return updatedLot;
              }
              return prevSelected;
            });
          } else if (payload.eventType === 'INSERT') {
            const newLot = transformLotData(payload.new);
            setParkingLots((prevLots) => [...prevLots, newLot]);
          } else if (payload.eventType === 'DELETE') {
            setParkingLots((prevLots) =>
              prevLots.filter((lot) => lot.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const handleManualRetry = () => {
    setError(null);
    setLoading(true);
    fetchParkingLots();
  };

  const handleMarkerPress = (lot) => {
    setSelectedParking(lot);
    setCardVisible(true);
  };

  const handleCardClose = () => setCardVisible(false);
  const handleSettingsPress = () => Alert.alert('Settings', 'Coming soon!');
  const handleNavigationPress = () => Alert.alert('Navigate', 'Coming soon!');
  const handleTalkPress = () => Alert.alert('Talk', 'Voice feature coming soon!');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        {/* Map is at the bottom layer */}
        <GoogleMaps 
          parkingLots={parkingLots} 
          onMarkerPress={handleMarkerPress} 
        />

        {/* Floating Top Bar */}
        <View style={styles.topBarWrapper}>
          <TopBar onSettingsPress={handleSettingsPress} />
        </View>

        {/* Parking Card Overlay */}
        <ParkingCard 
          visible={cardVisible}
          parking={selectedParking}
          onClose={handleCardClose}
        />

        {/* Floating Bottom Nav */}
        <View style={styles.bottomNavWrapper}>
          <BottomNavBar 
            onNavigationPress={handleNavigationPress}
            onTalkPress={handleTalkPress}
          />
        </View>

        {loading && parkingLots.length === 0 && (
          <View style={styles.overlayContainer}>
             <LoadingSpinner message="Locating spots..." />
          </View>
        )}

        {error && (
          <View style={styles.overlayContainer}>
            <ErrorMessage 
              error={error}
              onRetry={handleManualRetry}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBarWrapper: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  bottomNavWrapper: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    zIndex: 10,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 10, 10, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  }
});
