import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Linking, Platform, Alert, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useStoreStore } from '@/store/storeStore';
import { Store } from '@/lib/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const tierColors: Record<string, string> = {
  basic: '#A0A0A0',
  verified: '#22C55E',
  premium: '#C47A2C',
};

const tierLabels: Record<string, string> = {
  basic: 'Tienda',
  verified: 'Verificada',
  premium: 'Premium',
};

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const { stores, selectedStore, isLoading, fetchNearbyStores, fetchStores, selectStore } = useStoreStore();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    requestLocationAndFetch();
  }, []);

  const requestLocationAndFetch = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Permiso de ubicación denegado');
        // Fallback: load all stores without location filter
        await fetchStores();
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      setUserLocation(coords);
      await fetchNearbyStores(coords.latitude, coords.longitude, 100);
    } catch (error: any) {
      setLocationError('No se pudo obtener ubicación');
      await fetchStores();
    }
  };

  const openDirections = (store: Store) => {
    const url = Platform.select({
      ios: `maps:?daddr=${store.latitude},${store.longitude}`,
      android: `google.navigation:q=${store.latitude},${store.longitude}`,
    });
    if (url) Linking.openURL(url);
  };

  const openContact = (type: 'phone' | 'instagram' | 'website', value: string) => {
    if (type === 'phone') Linking.openURL(`tel:${value}`);
    else if (type === 'instagram') Linking.openURL(`https://instagram.com/${value.replace('@', '')}`);
    else if (type === 'website') Linking.openURL(value.startsWith('http') ? value : `https://${value}`);
  };

  const initialRegion = userLocation
    ? { ...userLocation, latitudeDelta: 0.1, longitudeDelta: 0.1 }
    : { latitude: -33.4489, longitude: -70.6693, latitudeDelta: 0.5, longitudeDelta: 0.5 }; // Santiago default

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0A0A' }} edges={['top']}>
      {/* Header */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ fontSize: 24, fontWeight: '700', color: '#FFFFFF' }}>Tiendas Grow</Text>
          <Text style={{ fontSize: 12, color: '#A0A0A0', marginTop: 2 }}>
            {stores.length} {stores.length === 1 ? 'tienda' : 'tiendas'} encontradas
          </Text>
        </View>
        <TouchableOpacity
          onPress={requestLocationAndFetch}
          style={{ backgroundColor: '#1A1A2E', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#3A3A4E' }}
        >
          <Text style={{ fontSize: 16 }}>📍</Text>
        </TouchableOpacity>
      </View>

      {/* Map */}
      <View style={{ flex: 1 }}>
        {isLoading && !mapReady ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0A' }}>
            <ActivityIndicator size="large" color="#22C55E" />
            <Text style={{ color: '#A0A0A0', marginTop: 12 }}>Cargando tiendas...</Text>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            initialRegion={initialRegion}
            showsUserLocation={true}
            showsMyLocationButton={false}
            onMapReady={() => setMapReady(true)}
            customMapStyle={darkMapStyle}
          >
            {stores.map((store) => (
              <Marker
                key={store.id}
                coordinate={{ latitude: store.latitude, longitude: store.longitude }}
                onPress={() => selectStore(store)}
                pinColor={tierColors[store.tier] || '#22C55E'}
              >
                <View style={{ alignItems: 'center' }}>
                  <View style={{
                    backgroundColor: tierColors[store.tier] || '#22C55E',
                    borderRadius: 20,
                    width: 36,
                    height: 36,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 2,
                    borderColor: '#FFFFFF',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 5,
                  }}>
                    <Text style={{ fontSize: 18 }}>🌿</Text>
                  </View>
                </View>
              </Marker>
            ))}
          </MapView>
        )}

        {/* Location error banner */}
        {locationError && (
          <View style={{ position: 'absolute', top: 8, left: 16, right: 16, backgroundColor: '#C47A2C' + 'CC', borderRadius: 8, padding: 10 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 12, textAlign: 'center' }}>{locationError}</Text>
          </View>
        )}
      </View>

      {/* Store Detail Card */}
      {selectedStore && (
        <View style={{
          backgroundColor: '#1A1A2E',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: 20,
          borderTopWidth: 1,
          borderColor: '#3A3A4E',
        }}>
          {/* Drag handle */}
          <View style={{ width: 40, height: 4, backgroundColor: '#3A3A4E', borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 }}>
                {selectedStore.name}
              </Text>
              <Text style={{ fontSize: 13, color: '#A0A0A0', marginBottom: 8 }}>
                {selectedStore.address}, {selectedStore.city}
              </Text>
            </View>
            <View style={{
              backgroundColor: tierColors[selectedStore.tier] + '20',
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 6,
            }}>
              <Text style={{ color: tierColors[selectedStore.tier], fontWeight: '600', fontSize: 11 }}>
                {selectedStore.is_verified ? '✓ ' : ''}{tierLabels[selectedStore.tier]}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              onPress={() => openDirections(selectedStore)}
              style={{
                flex: 1,
                backgroundColor: '#22C55E',
                borderRadius: 10,
                paddingVertical: 12,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Text style={{ fontSize: 14 }}>🧭</Text>
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 14 }}>Ir</Text>
            </TouchableOpacity>

            {selectedStore.contact?.phone && (
              <TouchableOpacity
                onPress={() => openContact('phone', selectedStore.contact!.phone!)}
                style={{
                  flex: 1,
                  backgroundColor: '#1A1A2E',
                  borderRadius: 10,
                  paddingVertical: 12,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#3A3A4E',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Text style={{ fontSize: 14 }}>📞</Text>
                <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14 }}>Llamar</Text>
              </TouchableOpacity>
            )}

            {selectedStore.contact?.instagram && (
              <TouchableOpacity
                onPress={() => openContact('instagram', selectedStore.contact!.instagram!)}
                style={{
                  flex: 1,
                  backgroundColor: '#1A1A2E',
                  borderRadius: 10,
                  paddingVertical: 12,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#3A3A4E',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Text style={{ fontSize: 14 }}>📸</Text>
                <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 14 }}>IG</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => selectStore(null)}
              style={{
                backgroundColor: '#1A1A2E',
                borderRadius: 10,
                paddingVertical: 12,
                paddingHorizontal: 14,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: '#3A3A4E',
              }}
            >
              <Text style={{ fontSize: 14 }}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// Dark mode map style for Google Maps
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#212121' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
  { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#757575' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#181818' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1B3D1B' }] },
  { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#2C2C2C' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212121' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3C3C3C' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2F3948' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#000000' }] },
];
