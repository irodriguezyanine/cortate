import api, { endpoints, apiHelpers } from './api'

/**
 * Authentication Service
 * Handles all authentication-related API calls
 */
export const authService = {
  /**
   * Login user
   * @param {Object} credentials - Email and password
   * @returns {Promise} API response with user data and token
   */
  login: async (credentials) => {
    const { email, password, rememberMe = false } = credentials
    
    const response = await apiHelpers.post(endpoints.auth.login, {
      email: email.toLowerCase().trim(),
      password,
      rememberMe
    })
    
    return response
  },

  /**
   * Register new client
   * @param {Object} userData - User registration data
   * @returns {Promise} API response with user data and token
   */
  registerClient: async (userData) => {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      dateOfBirth,
      acceptTerms
    } = userData
    
    const response = await apiHelpers.post(`${endpoints.auth.register}/client`, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone.replace(/\s/g, ''),
      dateOfBirth,
      acceptTerms
    })
    
    return response
  },

  /**
   * Register new barber
   * @param {Object} userData - Barber registration data
   * @returns {Promise} API response with user data and token
   */
  registerBarber: async (userData) => {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      businessName,
      rut,
      address,
      acceptTerms
    } = userData
    
    const response = await apiHelpers.post(`${endpoints.auth.register}/barber`, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone.replace(/\s/g, ''),
      businessName: businessName.trim(),
      rut: rut.replace(/[.-]/g, ''),
      address: address.trim(),
      acceptTerms
    })
    
    return response
  },

  /**
   * Logout user
   * @returns {Promise} API response
   */
  logout: async () => {
    try {
      const response = await apiHelpers.post(endpoints.auth.logout)
      return response
    } catch (error) {
      // Even if logout fails on server, we should clear local data
      console.warn('Logout API call failed, but continuing with local cleanup')
      return { success: true }
    }
  },

  /**
   * Get current user profile
   * @returns {Promise} API response with user data
   */
  getProfile: async () => {
    const response = await apiHelpers.get(endpoints.auth.profile)
    return response
  },

  /**
   * Update user profile
   * @param {Object} profileData - Updated profile data
   * @returns {Promise} API response with updated user data
   */
  updateProfile: async (profileData) => {
    // Clean and format data
    const cleanData = {}
    
    if (profileData.firstName) {
      cleanData.firstName = profileData.firstName.trim()
    }
    if (profileData.lastName) {
      cleanData.lastName = profileData.lastName.trim()
    }
    if (profileData.phone) {
      cleanData.phone = profileData.phone.replace(/\s/g, '')
    }
    if (profileData.dateOfBirth) {
      cleanData.dateOfBirth = profileData.dateOfBirth
    }
    if (profileData.avatar) {
      cleanData.avatar = profileData.avatar
    }
    if (profileData.preferences) {
      cleanData.preferences = profileData.preferences
    }
    
    const response = await apiHelpers.put(endpoints.auth.profile, cleanData)
    return response
  },

  /**
   * Change user password
   * @param {Object} passwordData - Current and new password
   * @returns {Promise} API response
   */
  changePassword: async (passwordData) => {
    const { currentPassword, newPassword, confirmPassword } = passwordData
    
    if (newPassword !== confirmPassword) {
      throw new Error('Las contraseñas no coinciden')
    }
    
    const response = await apiHelpers.put(endpoints.auth.changePassword, {
      currentPassword,
      newPassword
    })
    
    return response
  },

  /**
   * Refresh authentication token
   * @returns {Promise} API response with new token
   */
  refreshToken: async () => {
    const response = await apiHelpers.post(endpoints.auth.refresh)
    return response
  },

  /**
   * Request password reset
   * @param {string} email - User email
   * @returns {Promise} API response
   */
  forgotPassword: async (email) => {
    const response = await apiHelpers.post(endpoints.auth.forgotPassword, {
      email: email.toLowerCase().trim()
    })
    
    return response
  },

  /**
   * Reset password with token
   * @param {string} token - Reset token from email
   * @param {string} password - New password
   * @returns {Promise} API response
   */
  resetPassword: async (token, password) => {
    const response = await apiHelpers.post(endpoints.auth.resetPassword, {
      token,
      password
    })
    
    return response
  },

  /**
   * Verify email with token
   * @param {string} token - Verification token from email
   * @returns {Promise} API response
   */
  verifyEmail: async (token) => {
    const response = await apiHelpers.get(`${endpoints.auth.base}/verify-email/${token}`)
    return response
  },

  /**
   * Resend email verification
   * @returns {Promise} API response
   */
  resendVerification: async () => {
    const response = await apiHelpers.post(`${endpoints.auth.base}/resend-verification`)
    return response
  },

  /**
   * Upload profile avatar
   * @param {File} file - Image file
   * @param {Function} onProgress - Progress callback
   * @returns {Promise} API response with image URL
   */
  uploadAvatar: async (file, onProgress) => {
    // Validate file
    if (!file) {
      throw new Error('No se seleccionó ningún archivo')
    }
    
    if (!file.type.startsWith('image/')) {
      throw new Error('Solo se permiten archivos de imagen')
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB
      throw new Error('El archivo es demasiado grande (máximo 5MB)')
    }
    
    const formData = new FormData()
    formData.append('avatar', file)
    
    const response = await apiHelpers.upload(`${endpoints.auth.profile}/avatar`, formData, onProgress)
    return response
  },

  /**
   * Delete user account
   * @param {string} password - Current password for confirmation
   * @returns {Promise} API response
   */
  deleteAccount: async (password) => {
    const response = await apiHelpers.delete(endpoints.auth.profile, {
      data: { password }
    })
    
    return response
  },

  /**
   * Check if email is available
   * @param {string} email - Email to check
   * @returns {Promise} API response
   */
  checkEmailAvailability: async (email) => {
    try {
      const response = await apiHelpers.post(`${endpoints.auth.base}/check-email`, {
        email: email.toLowerCase().trim()
      }, {
        hideErrorToast: true
      })
      
      return response
    } catch (error) {
      if (error.response?.status === 409) {
        return { available: false }
      }
      throw error
    }
  },

  /**
   * Get user statistics
   * @returns {Promise} API response with user stats
   */
  getUserStats: async () => {
    const response = await apiHelpers.get(`${endpoints.users.me}/stats`)
    return response
  },

  /**
   * Update user preferences
   * @param {Object} preferences - User preferences
   * @returns {Promise} API response
   */
  updatePreferences: async (preferences) => {
    const response = await apiHelpers.put(`${endpoints.users.me}/preferences`, preferences)
    return response
  },

  /**
   * Get user notifications
   * @param {Object} params - Query parameters
   * @returns {Promise} API response with notifications
   */
  getNotifications: async (params = {}) => {
    const { page = 1, limit = 20, unreadOnly = false } = params
    
    const response = await apiHelpers.get(endpoints.users.notifications, {
      params: {
        page,
        limit,
        unreadOnly
      }
    })
    
    return response
  },

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise} API response
   */
  markNotificationRead: async (notificationId) => {
    const response = await apiHelpers.put(`${endpoints.users.notifications}/${notificationId}/read`)
    return response
  },

  /**
   * Clear all notifications
   * @returns {Promise} API response
   */
  clearAllNotifications: async () => {
    const response = await apiHelpers.delete(endpoints.users.notifications)
    return response
  }
}

// Export individual functions for convenience
export const {
  login,
  registerClient,
  registerBarber,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  uploadAvatar,
  deleteAccount,
  checkEmailAvailability,
  getUserStats,
  updatePreferences,
  getNotifications,
  markNotificationRead,
  clearAllNotifications
} = authService

export default authService
