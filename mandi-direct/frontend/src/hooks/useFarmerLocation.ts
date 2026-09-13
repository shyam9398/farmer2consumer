import { useState, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';

export interface GeoLocationCoordinates {
  latitude: number;
  longitude: number;
}

export const useFarmerLocation = () => {
  const [coordinates, setCoordinates] = useState<GeoLocationCoordinates | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  const detectLocation = useCallback(async (): Promise<GeoLocationCoordinates | null> => {
    setIsDetecting(true);
    setError(null);

    if (!('geolocation' in navigator)) {
      const msg = 'Geolocation is not supported by your browser';
      setError(msg);
      setIsDetecting(false);
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setCoordinates(coords);
          setIsDetecting(false);
          resolve(coords);
        },
        (err) => {
          setIsDetecting(false);
          let errMsg = t.farmerProfile.locationError;
          if (err.code === err.PERMISSION_DENIED) {
            errMsg = 'Location permission denied. Please allow location access or type manually.';
          }
          setError(errMsg);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 60000,
        }
      );
    });
  }, [t.farmerProfile.locationError]);

  return {
    coordinates,
    setCoordinates,
    isDetecting,
    error,
    detectLocation,
  };
};
