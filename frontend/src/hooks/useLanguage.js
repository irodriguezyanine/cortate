import { useState, useEffect, createContext, useContext } from 'react';

// Language context
const LanguageContext = createContext();

// Available languages
export const LANGUAGES = {
  es: {
    code: 'es',
    name: 'Español',
    flag: '🇨🇱'
  },
  en: {
    code: 'en', 
    name: 'English',
    flag: '🇺🇸'
  },
  pt: {
    code: 'pt',
    name: 'Português', 
    flag: '🇧🇷'
  }
};

// Translations
const translations = {
  es: {
    // Navigation & Common
    'app.title': 'CÓRTATE.CL',
    'app.tagline': 'Tu barbero perfecto, al instante',
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.close': 'Cerrar',
    'common.edit': 'Editar',
    'common.delete': 'Eliminar',
    'common.confirm': 'Confirmar',
    'common.back': 'Volver',
    'common.next': 'Siguiente',
    'common.previous': 'Anterior',
    
    // Authentication
    'auth.login': 'Iniciar Sesión',
    'auth.register': 'Registrarse',
    'auth.logout': 'Cerrar Sesión',
    'auth.email': 'Email',
    'auth.password': 'Contraseña',
    'auth.confirm_password': 'Confirmar Contraseña',
    'auth.full_name': 'Nombre Completo',
    'auth.user_type': '¿Qué tipo de usuario eres?',
    'auth.client': 'Cliente - Busco servicios de barbería',
    'auth.barber': 'Barbero - Ofrezco servicios',
    'auth.welcome_back': '¡Bienvenido de vuelta!',
    
    // Client Interface
    'client.map': 'Mapa',
    'client.quick_cut': 'Corte Rápido',  
    'client.profile': 'Perfil',
    'client.history': 'Historial',
    'client.quick_cut_title': 'Corte Rápido - Estilo Uber',
    'client.quick_cut_subtitle': 'Encuentra un barbero disponible cerca de ti',
    'client.select_service': 'Selecciona el servicio',
    'client.max_budget': 'Presupuesto máximo',
    'client.max_distance': 'Distancia máxima',
    'client.when_cut': '¿Cuándo quieres cortarte?',
    'client.asap': 'Lo antes posible',
    'client.in_30min': 'En 30 minutos',
    'client.in_1hour': 'En 1 hora', 
    'client.in_2hours': 'En 2 horas',
    'client.search_barber': 'Buscar Barbero',
    
    // Barber Interface
    'barber.calendar': 'Calendario',
    'barber.requests': 'Solicitudes',
    'barber.business': 'Mi Negocio',
    'barber.requests_title': 'Solicitudes Pendientes',
    'barber.requests_subtitle': 'Gestiona tus cortes rápidos y reservas tradicionales',
    'barber.accept': 'Aceptar',
    'barber.reject': 'Rechazar',
    'barber.quick_cut': 'Corte Rápido',
    'barber.traditional_booking': 'Reserva',
    'barber.client': 'Cliente',
    'barber.budget': 'Presupuesto',
    'barber.price': 'Precio',
    'barber.distance': 'Distancia',
    
    // Barbershop Management
    'barbershop.edit_info': 'Editar Información',
    'barbershop.upload_photos': 'Subir Fotos',
    'barbershop.view_reviews': 'Ver Reseñas',
    'barbershop.name': 'Nombre de tu barbería',
    'barbershop.description': 'Descripción',
    'barbershop.address': 'Dirección',
    'barbershop.phone': 'Teléfono',
    'barbershop.services': 'Servicios',
    'barbershop.working_hours': 'Horarios de trabajo',
    
    // Reviews
    'reviews.title': '¿Cómo estuvo tu corte?',
    'reviews.rating': 'Calificación',
    'reviews.comment': 'Comentario (opcional)',
    'reviews.photos': 'Fotos (opcional)',
    'reviews.submit': 'Enviar Reseña',
    'reviews.skip': 'Omitir',
    'reviews.response': 'Tu respuesta',
    'reviews.respond': 'Responder',
    'reviews.very_bad': 'Muy malo',
    'reviews.bad': 'Malo',
    'reviews.regular': 'Regular',
    'reviews.good': 'Bueno',
    'reviews.excellent': 'Excelente',
    
    // Chat
    'chat.title': 'Chat en tiempo real',
    'chat.online': 'En línea',
    'chat.offline': 'Desconectado',
    'chat.type_message': 'Escribe un mensaje...',
    'chat.start_conversation': 'Inicia la conversación',
    'chat.private_secure': 'Los mensajes son privados y seguros',
    
    // Notifications
    'notification.barber_found': 'Barbero encontrado',
    'notification.request_accepted': 'Solicitud aceptada',
    'notification.request_rejected': 'Solicitud rechazada',
    'notification.booking_confirmed': 'Reserva confirmada',
    'notification.review_sent': 'Reseña enviada',
    'notification.map_loaded': 'Mapa cargado',
    
    // Status
    'status.pending': 'Pendiente',
    'status.accepted': 'Aceptado',
    'status.rejected': 'Rechazado',
    'status.completed': 'Completado',
    'status.cancelled': 'Cancelado',
    
    // Errors
    'error.network': 'Error de conexión',
    'error.auth': 'Error de autenticación',
    'error.not_found': 'No encontrado',
    'error.permission': 'Sin permisos'
  },
  
  en: {
    // Navigation & Common
    'app.title': 'CÓRTATE.CL',
    'app.tagline': 'Your perfect barber, instantly',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.close': 'Close',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.confirm': 'Confirm',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    
    // Authentication
    'auth.login': 'Sign In',
    'auth.register': 'Sign Up',
    'auth.logout': 'Sign Out',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirm_password': 'Confirm Password',
    'auth.full_name': 'Full Name',
    'auth.user_type': 'What type of user are you?',
    'auth.client': 'Client - Looking for barber services',
    'auth.barber': 'Barber - Offering services',
    'auth.welcome_back': 'Welcome back!',
    
    // Client Interface
    'client.map': 'Map',
    'client.quick_cut': 'Quick Cut',
    'client.profile': 'Profile',
    'client.history': 'History',
    'client.quick_cut_title': 'Quick Cut - Uber Style',
    'client.quick_cut_subtitle': 'Find an available barber near you',
    'client.select_service': 'Select service',
    'client.max_budget': 'Maximum budget',
    'client.max_distance': 'Maximum distance',
    'client.when_cut': 'When do you want to get cut?',
    'client.asap': 'ASAP',
    'client.in_30min': 'In 30 minutes',
    'client.in_1hour': 'In 1 hour',
    'client.in_2hours': 'In 2 hours',
    'client.search_barber': 'Find Barber',
    
    // Barber Interface
    'barber.calendar': 'Calendar',
    'barber.requests': 'Requests',
    'barber.business': 'My Business',
    'barber.requests_title': 'Pending Requests',
    'barber.requests_subtitle': 'Manage your quick cuts and traditional bookings',
    'barber.accept': 'Accept',
    'barber.reject': 'Reject',
    'barber.quick_cut': 'Quick Cut',
    'barber.traditional_booking': 'Booking',
    'barber.client': 'Client',
    'barber.budget': 'Budget',
    'barber.price': 'Price',
    'barber.distance': 'Distance',
    
    // Barbershop Management
    'barbershop.edit_info': 'Edit Information',
    'barbershop.upload_photos': 'Upload Photos',
    'barbershop.view_reviews': 'View Reviews',
    'barbershop.name': 'Your barbershop name',
    'barbershop.description': 'Description',
    'barbershop.address': 'Address',
    'barbershop.phone': 'Phone',
    'barbershop.services': 'Services',
    'barbershop.working_hours': 'Working hours',
    
    // Reviews
    'reviews.title': 'How was your cut?',
    'reviews.rating': 'Rating',
    'reviews.comment': 'Comment (optional)',
    'reviews.photos': 'Photos (optional)',
    'reviews.submit': 'Submit Review',
    'reviews.skip': 'Skip',
    'reviews.response': 'Your response',
    'reviews.respond': 'Respond',
    'reviews.very_bad': 'Very bad',
    'reviews.bad': 'Bad',
    'reviews.regular': 'Regular',
    'reviews.good': 'Good',
    'reviews.excellent': 'Excellent',
    
    // Chat
    'chat.title': 'Real-time chat',
    'chat.online': 'Online',
    'chat.offline': 'Offline',
    'chat.type_message': 'Type a message...',
    'chat.start_conversation': 'Start the conversation',
    'chat.private_secure': 'Messages are private and secure',
    
    // Notifications
    'notification.barber_found': 'Barber found',
    'notification.request_accepted': 'Request accepted',
    'notification.request_rejected': 'Request rejected',
    'notification.booking_confirmed': 'Booking confirmed',
    'notification.review_sent': 'Review submitted',
    'notification.map_loaded': 'Map loaded',
    
    // Status
    'status.pending': 'Pending',
    'status.accepted': 'Accepted',
    'status.rejected': 'Rejected',
    'status.completed': 'Completed',
    'status.cancelled': 'Cancelled',
    
    // Errors
    'error.network': 'Network error',
    'error.auth': 'Authentication error',
    'error.not_found': 'Not found',
    'error.permission': 'Access denied'
  },
  
  pt: {
    // Navigation & Common
    'app.title': 'CÓRTATE.CL',
    'app.tagline': 'Seu barbeiro perfeito, instantaneamente',
    'common.loading': 'Carregando...',
    'common.error': 'Erro',
    'common.success': 'Sucesso',
    'common.save': 'Salvar',
    'common.cancel': 'Cancelar',
    'common.close': 'Fechar',
    'common.edit': 'Editar',
    'common.delete': 'Excluir',
    'common.confirm': 'Confirmar',
    'common.back': 'Voltar',
    'common.next': 'Próximo',
    'common.previous': 'Anterior',
    
    // Authentication
    'auth.login': 'Entrar',
    'auth.register': 'Cadastrar',
    'auth.logout': 'Sair',
    'auth.email': 'Email',
    'auth.password': 'Senha',
    'auth.confirm_password': 'Confirmar Senha',
    'auth.full_name': 'Nome Completo',
    'auth.user_type': 'Que tipo de usuário você é?',
    'auth.client': 'Cliente - Procuro serviços de barbearia',
    'auth.barber': 'Barbeiro - Ofereço serviços',
    'auth.welcome_back': 'Bem-vindo de volta!',
    
    // Client Interface
    'client.map': 'Mapa',
    'client.quick_cut': 'Corte Rápido',
    'client.profile': 'Perfil',
    'client.history': 'Histórico',
    'client.quick_cut_title': 'Corte Rápido - Estilo Uber',
    'client.quick_cut_subtitle': 'Encontre um barbeiro disponível perto de você',
    'client.select_service': 'Selecione o serviço',
    'client.max_budget': 'Orçamento máximo',
    'client.max_distance': 'Distância máxima',
    'client.when_cut': 'Quando você quer cortar?',
    'client.asap': 'O mais rápido possível',
    'client.in_30min': 'Em 30 minutos',
    'client.in_1hour': 'Em 1 hora',
    'client.in_2hours': 'Em 2 horas',
    'client.search_barber': 'Buscar Barbeiro'
  }
};

// Language Provider
export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('es');

  useEffect(() => {
    // Load saved language from localStorage
    const savedLanguage = localStorage.getItem('preferred_language');
    if (savedLanguage && translations[savedLanguage]) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  const changeLanguage = (languageCode) => {
    if (translations[languageCode]) {
      setCurrentLanguage(languageCode);
      localStorage.setItem('preferred_language', languageCode);
      
      // Update document language attribute
      document.documentElement.lang = languageCode;
    }
  };

  const t = (key, defaultValue = key) => {
    return translations[currentLanguage]?.[key] || defaultValue;
  };

  const value = {
    currentLanguage,
    changeLanguage,
    t,
    languages: LANGUAGES,
    availableLanguages: Object.keys(translations)
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// Hook to use language context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};