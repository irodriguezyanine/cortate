import React from 'react'
import { motion } from 'framer-motion'
import { Scissors, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'

const LoadingSpinner = ({ 
  size = 'md', 
  variant = 'default',
  fullScreen = false,
  message = '',
  className = ''
}) => {
  // ... (todo tu código de LoadingSpinner sin cambios, está perfecto)
  // ...
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  const containerClasses = {
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  }

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingAnimation size={size} variant={variant} />
          {message && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-4 text-white text-lg"
            >
              {message}
            </motion.p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={clsx(
      'flex items-center justify-center',
      containerClasses[size],
      className
    )}>
      <div className="text-center">
        <LoadingAnimation size={size} variant={variant} />
        {message && (
          <p className="mt-2 text-gray-600 text-sm">
            {message}
          </p>
        )}
      </div>
    </div>
  )
}

const LoadingAnimation = ({ size, variant }) => {
  // ... (todo tu código de LoadingAnimation sin cambios)
  // ...
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  if (variant === 'scissors') {
    return (
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ 
          duration: 2, 
          repeat: Infinity, 
          ease: "linear" 
        }}
        className={clsx(
          'text-primary-500',
          sizeClasses[size]
        )}
      >
        <Scissors className="w-full h-full" />
      </motion.div>
    )
  }

  // ... (resto de tus variantes de animación sin cambios)

  // Default spinner
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ 
        duration: 1, 
        repeat: Infinity, 
        ease: "linear" 
      }}
      className={clsx(
        'text-primary-500',
        sizeClasses[size]
      )}
    >
      <Loader2 className="w-full h-full" />
    </motion.div>
  )
}

// Skeleton loader component
export const SkeletonLoader = ({ 
  className = '',
  lines = 1,
  circle = false,
  width = 'w-full',
  height = 'h-4'
}) => { /* ... Tu código sin cambios ... */ }

// Card skeleton
export const CardSkeleton = () => ( /* ... Tu código sin cambios ... */ )

// List skeleton
export const ListSkeleton = ({ items = 5 }) => (
  <div className="space-y-4">
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} className="flex items-center space-x-4 p-4">
        <SkeletonLoader circle width="w-16" height="h-16" />
        <div className="flex-1 space-y-2">
          <SkeletonLoader width="w-3/4" height="h-5" />
          <SkeletonLoader width="w-1/2" height="h-4" />
          <div className="flex space-x-4">
            <SkeletonLoader width="w-20" height="h-3" />
            <SkeletonLoader width="w-20" height="h-3" />
          </div>
        </div>
        <SkeletonLoader width="w-24" height="h-8" />
      </div>
    ))}
  </div>
)

// ====================================================================
// ======================> INICIO DE LA CORRECCIÓN <=====================
// ====================================================================

// Creamos un "alias" para que la importación en BarberList.jsx funcione sin cambios.
// Ahora "CardListSkeleton" apunta a tu componente "ListSkeleton".
export const CardListSkeleton = ListSkeleton;

// ====================================================================
// ======================> FIN DE LA CORRECCIÓN <======================
// ====================================================================

// Loading button component
export const LoadingButton = ({ 
  loading = false, 
  children, 
  loadingText = 'Cargando...',
  className = '',
  ...props 
}) => ( /* ... Tu código sin cambios ... */ )

// Page loading component
export const PageLoader = ({ message = 'Cargando...' }) => ( /* ... Tu código sin cambios ... */ )

export default LoadingSpinner
