import { useEffect, useRef, useState } from 'react';

export const useGooglePlaces = (apiKey) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [autocomplete, setAutocomplete] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!apiKey) return;

    const initializeAutocomplete = () => {
      if (window.google && window.google.maps && window.google.maps.places && inputRef.current) {
        const autocompleteInstance = new window.google.maps.places.Autocomplete(inputRef.current, {
          types: ['address'],
          componentRestrictions: { country: 'cl' }, // Restrict to Chile
          fields: ['address_components', 'geometry', 'name', 'formatted_address']
        });

        setAutocomplete(autocompleteInstance);
        setIsLoaded(true);
      }
    };

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      initializeAutocomplete();
    } else {
      // Wait for the main app to load Google Maps API
      const checkForGoogleMaps = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          clearInterval(checkForGoogleMaps);
          initializeAutocomplete();
        }
      }, 100);

      // Cleanup interval after 10 seconds
      setTimeout(() => {
        clearInterval(checkForGoogleMaps);
      }, 10000);

      return () => clearInterval(checkForGoogleMaps);
    }
  }, [apiKey]);

  const setupPlaceChangedListener = (callback) => {
    if (autocomplete) {
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        
        if (place.geometry) {
          const addressComponents = place.address_components || [];
          const location = {
            formatted_address: place.formatted_address,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            components: {}
          };

          // Parse address components
          addressComponents.forEach(component => {
            const type = component.types[0];
            switch (type) {
              case 'street_number':
                location.components.street_number = component.long_name;
                break;
              case 'route':
                location.components.street_name = component.long_name;
                break;
              case 'locality':
                location.components.city = component.long_name;
                break;
              case 'administrative_area_level_1':
                location.components.state = component.long_name;
                break;
              case 'country':
                location.components.country = component.long_name;
                break;
              case 'postal_code':
                location.components.postal_code = component.long_name;
                break;
            }
          });

          callback(location);
        }
      });
    }
  };

  return {
    isLoaded,
    inputRef,
    setupPlaceChangedListener
  };
};