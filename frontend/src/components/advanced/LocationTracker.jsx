import React, { useState, useEffect } from 'react'
import { MapPin, Navigation } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'

export const LocationTracker = ({ onLocationUpdate, enabled = false }) => {
  const [currentLocation, setCurrentLocation] = useState(null)
  const [accuracy, setAccuracy] = useState(null)
  const [isTracking, setIsTracking] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let watchId = null

    if (enabled && isTracking) {
      if ('geolocation' in navigator) {
        watchId = navigator.geolocation.watchPosition(
          (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date()
            }
            setCurrentLocation(location)
            setAccuracy(position.coords.accuracy)
            setError(null)
            onLocationUpdate?.(location)
          },
          (error) => {
            setError(`Error de ubicación: ${error.message}`)
            setIsTracking(false)
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          }
        )
      } else {
        setError('Geolocalización no disponible')
      }
    }

    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [enabled, isTracking, onLocationUpdate])

  const toggleTracking = () => {
    setIsTracking(!isTracking)
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={toggleTracking}
        variant={isTracking ? "default" : "outline"}
        size="sm"
        className={isTracking ? "bg-green-600 hover:bg-green-700" : "text-white border-gray-600"}
      >
        <Navigation className={`w-4 h-4 mr-1 ${isTracking ? 'animate-pulse' : ''}`} />
        {isTracking ? 'Rastreando' : 'Rastrear ubicación'}
      </Button>
      
      {accuracy && (
        <Badge variant="outline" className="text-green-400 border-green-400">
          <MapPin className="w-3 h-3 mr-1" />
          ±{Math.round(accuracy)}m
        </Badge>
      )}
      
      {error && (
        <Badge variant="destructive" className="text-red-400">
          Error GPS
        </Badge>
      )}
    </div>
  )
}