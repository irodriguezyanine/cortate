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

  if (variant === 'pulse') {
    return (
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [1, 0.7, 1]
        }}
        transition={{ 
          duration: 1.5, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className={clsx(
          'bg-primary-500 rounded-full',
          sizeClasses[size]
        )}
      />
    )
  }

  if (variant === 'dots') {
    return (
      <div className="flex space-x-1">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            animate={{ 
              y: [0, -8, 0],
              opacity: [0.4, 1, 0.4]
            }}
            transition={{ 
              duration: 0.8, 
              repeat: Infinity, 
              delay: index * 0.1,
              ease: "easeInOut"
            }}
            className={clsx(
              'bg-primary-500 rounded-full',
              size === 'sm' ? 'w-1 h-1' :
              size === 'md' ? 'w-2 h-2' :
              size === 'lg' ? 'w-3 h-3' : 'w-4 h-4'
            )}
          />
        ))}
      </div>
    )
  }

  if (variant === 'ring') {
    return (
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ 
          duration: 1, 
          repeat: Infinity, 
          ease: "linear" 
        }}
        className={clsx(
          'border-2 border-primary-500/30 border-t-primary-500 rounded-full',
          sizeClasses[size]
        )}
      />
    )
  }

  if (variant === 'barbershop') {
    return (
      <div className="relative">
        {/* Barber pole animation */}
        <motion.div
          className={clsx(
            'relative bg-gradient-to-b from-red-500 via-white to-blue-500 rounded-full',
            sizeClasses[size]
          )}
          animate={{ rotate: 360 }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        >
          {/* Diagonal stripes */}
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-transparent via-red-500/50 to-transparent"
              animate={{ rotate: [0, 360] }}
              transition={{ 
                duration: 2, 
                repeat: Infinity, 
                ease: "linear" 
              }}
            />
          </div>
        </motion.div>
        
        {/* Scissors icon in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Scissors className={clsx(
            'text-primary-500',
            size === 'sm' ? 'w-2 h-2' :
            size === 'md' ? 'w-4 h-4' :
            size === 'lg' ? 'w-6 h-6' : 'w-8 h-8'
          )} />
        </div>
      </div>
    )
  }

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
}) => {
  if (circle) {
    return (
      <div className={clsx(
        'bg-gray-300 dark:bg-gray-700 rounded-full animate-pulse',
        width,
        height,
        className
      )} />
    )
  }

  return (
    <div className={clsx('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={clsx(
            'bg-gray-300 dark:bg-gray-700 rounded animate-pulse',
            width,
            height,
            index === lines - 1 && lines > 1 ? 'w-3/4' : ''
          )}
        />
      ))}
    </div>
  )
}

// Card skeleton
export const CardSkeleton = () => (
  <div className="card p-4 space-y-4">
    <div className="flex items-center space-x-4">
      <SkeletonLoader circle width="w-12" height="h-12" />
      <div className="flex-1 space-y-2">
        <SkeletonLoader width="w-1/2" height="h-4" />
        <SkeletonLoader width="w-1/3" height="h-3" />
      </div>
    </div>
    <SkeletonLoader lines={3} height="h-3" />
    <div className="flex justify-between">
      <SkeletonLoader width="w-20" height="h-6" />
      <SkeletonLoader width="w-16" height="h-6" />
    </div>
  </div>
)

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

// Loading button component
export const LoadingButton = ({ 
  loading = false, 
  children, 
  loadingText = 'Cargando...',
  className = '',
  ...props 
}) => (
  <button
    {...props}
    disabled={loading || props.disabled}
    className={clsx(
      'btn relative',
      loading && 'cursor-not-allowed',
      className
    )}
  >
    {loading && (
      <div className="absolute inset-0 flex items-center justify-center">
        <LoadingSpinner size="sm" />
      </div>
    )}
    <span className={loading ? 'opacity-0' : 'opacity-100'}>
      {loading ? loadingText : children}
    </span>
  </button>
)

// Page loading component
export const PageLoader = ({ message = 'Cargando...' }) => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="text-center">
      <LoadingSpinner size="xl" variant="barbershop" />
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-6 text-white text-xl font-medium"
      >
        {message}
      </motion.p>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-4 flex justify-center space-x-1"
      >
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity, 
              delay: index * 0.2,
              ease: "easeInOut"
            }}
            className="w-2 h-2 bg-primary-500 rounded-full"
          />
        ))}
      </motion.div>
    </div>
  </div>
)

export default LoadingSpinner
