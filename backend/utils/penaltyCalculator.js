const config = require('../config/config');

/**
 * Calcular penalización por no presentarse (no-show)
 * @param {Object} booking - Datos de la reserva
 * @param {Array} recentPenalties - Penalizaciones recientes del barbero
 * @returns {Object} Datos de la penalización calculada
 */
const calculateNoShowPenalty = (booking, recentPenalties = []) => {
    const baseAmount = booking.payment?.amount || 0;
    const noShowCount = recentPenalties.filter(p => p.type === 'no_show').length;
    
    // Escalar severidad basada en historial
    let severity = 'minor';
    let suspensionDays = 0;
    let monetaryPenalty = baseAmount * 0.5; // 50% del valor del servicio
    let reputationImpact = 0.1; // Impacto en el score de confiabilidad
    
    if (noShowCount >= 3) {
        severity = 'severe';
        suspensionDays = 14;
        monetaryPenalty = baseAmount * 0.8;
        reputationImpact = 0.5;
    } else if (noShowCount >= 1) {
        severity = 'moderate';
        suspensionDays = 7;
        monetaryPenalty = baseAmount * 0.6;
        reputationImpact = 0.3;
    }
    
    return {
        type: 'no_show',
        severity,
        monetaryAmount: Math.round(monetaryPenalty),
        suspensionDays,
        reputationImpact,
        reason: 'No presentarse a cita confirmada',
        description: `Barbero no se presentó a la reserva ${booking.bookingNumber}. ${noShowCount > 0 ? `Reincidencia: ${noShowCount + 1} veces` : 'Primera vez'}`,
        autoApplied: true,
        escalation: noShowCount >= 2 ? 'severe' : noShowCount >= 1 ? 'moderate' : 'minor'
    };
};

/**
 * Calcular penalización por cancelación tardía
 * @param {Object} booking - Datos de la reserva
 * @param {Date} cancellationTime - Hora de cancelación
 * @param {Array} recentPenalties - Penalizaciones recientes
 * @returns {Object} Datos de la penalización calculada
 */
const calculateLateCancellationPenalty = (booking, cancellationTime, recentPenalties = []) => {
    const baseAmount = booking.payment?.amount || 0;
    const scheduledFor = new Date(booking.scheduledFor);
    const hoursUntilService = (scheduledFor - cancellationTime) / (1000 * 60 * 60);
    
    const lateCancellationCount = recentPenalties.filter(p => p.type === 'late_cancellation').length;
    
    let severity = 'minor';
    let monetaryPenalty = 0;
    let suspensionDays = 0;
    let reputationImpact = 0.05;
    
    // Penalización basada en tiempo de anticipación
    if (hoursUntilService < 1) {
        // Menos de 1 hora
        severity = 'moderate';
        monetaryPenalty = baseAmount * 0.3;
        suspensionDays = lateCancellationCount >= 2 ? 3 : 0;
        reputationImpact = 0.2;
    } else if (hoursUntilService < 2) {
        // Menos de 2 horas
        severity = 'minor';
        monetaryPenalty = baseAmount * 0.1;
        suspensionDays = lateCancellationCount >= 5 ? 1 : 0;
        reputationImpact = 0.1;
    }
    
    // Escalar por reincidencia
    if (lateCancellationCount >= 3) {
        severity = 'moderate';
        suspensionDays = Math.max(suspensionDays, 2);
        monetaryPenalty *= 1.5;
        reputationImpact *= 1.5;
    }
    
    return {
        type: 'late_cancellation',
        severity,
        monetaryAmount: Math.round(monetaryPenalty),
        suspensionDays,
        reputationImpact,
        reason: `Cancelación tardía (${hoursUntilService.toFixed(1)} horas de anticipación)`,
        description: `Cancelación con ${hoursUntilService.toFixed(1)} horas de anticipación. Mínimo requerido: 2 horas.`,
        autoApplied: true,
        cancellationTiming: {
            hoursUntil: hoursUntilService,
            threshold: 2,
            withinThreshold: hoursUntilService < 2
        }
    };
};

/**
 * Calcular penalización por rechazo de reservas
 * @param {Array} rejectedBookings - Reservas rechazadas recientemente
 * @param {Array} recentPenalties - Penalizaciones recientes
 * @returns {Object} Datos de la penalización calculada
 */
const calculateRejectionPenalty = (rejectedBookings, recentPenalties = []) => {
    const rejectionsToday = rejectedBookings.filter(booking => {
        const rejectionDate = new Date(booking.rejectedAt);
        const today = new Date();
        return rejectionDate.toDateString() === today.toDateString();
    }).length;
    
    const rejectionsThisWeek = rejectedBookings.filter(booking => {
        const rejectionDate = new Date(booking.rejectedAt);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return rejectionDate >= weekAgo;
    }).length;
    
    let severity = 'minor';
    let suspensionDays = 0;
    let reputationImpact = 0.05;
    
    // Penalización por rechazos excesivos
    if (rejectionsToday >= 5) {
        severity = 'moderate';
        suspensionDays = 1;
        reputationImpact = 0.3;
    } else if (rejectionsThisWeek >= 15) {
        severity = 'severe';
        suspensionDays = 7;
        reputationImpact = 0.5;
    } else if (rejectionsToday >= 3) {
        severity = 'minor';
        reputationImpact = 0.1;
    }
    
    return {
        type: 'rejection',
        severity,
        monetaryAmount: 0, // No hay penalización monetaria por rechazos
        suspensionDays,
        reputationImpact,
        reason: 'Rechazo excesivo de reservas',
        description: `${rejectionsToday} rechazos hoy, ${rejectionsThisWeek} esta semana. Límite recomendado: 3 por día.`,
        autoApplied: true,
        rejectionStats: {
            today: rejectionsToday,
            thisWeek: rejectionsThisWeek,
            dailyLimit: 3,
            weeklyLimit: 15
        }
    };
};

/**
 * Calcular penalización por servicio deficiente
 * @param {Array} poorReviews - Reseñas negativas recientes
 * @param {Object} barberStats - Estadísticas del barbero
 * @returns {Object} Datos de la penalización calculada
 */
const calculatePoorServicePenalty = (poorReviews, barberStats) => {
    const recentPoorReviews = poorReviews.filter(review => {
        const reviewDate = new Date(review.createdAt);
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return reviewDate >= monthAgo && review.rating <= 2;
    });
    
    const averageRating = barberStats.rating || 5;
    const totalReviews = barberStats.totalReviews || 0;
    
    let severity = 'minor';
    let suspensionDays = 0;
    let reputationImpact = 0.1;
    
    // Evaluar severidad
    if (averageRating < 3 && totalReviews >= 10) {
        severity = 'severe';
        suspensionDays = 7;
        reputationImpact = 0.4;
    } else if (recentPoorReviews.length >= 3) {
        severity = 'moderate';
        suspensionDays = 3;
        reputationImpact = 0.2;
    }
    
    return {
        type: 'poor_service',
        severity,
        monetaryAmount: 0,
        suspensionDays,
        reputationImpact,
        reason: 'Calidad de servicio deficiente',
        description: `Rating promedio: ${averageRating.toFixed(1)}, ${recentPoorReviews.length} reseñas negativas recientes`,
        autoApplied: false, // Requiere revisión manual
        serviceQuality: {
            averageRating,
            totalReviews,
            recentPoorReviews: recentPoorReviews.length,
            threshold: 3.0
        }
    };
};

/**
 * Calcular penalización por violación de políticas
 * @param {string} violationType - Tipo de violación
 * @param {Object} details - Detalles de la violación
 * @param {Array} recentPenalties - Penalizaciones recientes
 * @returns {Object} Datos de la penalización calculada
 */
const calculatePolicyViolationPenalty = (violationType, details, recentPenalties = []) => {
    const policyViolations = recentPenalties.filter(p => p.type === 'policy_violation').length;
    
    let severity = 'moderate';
    let suspensionDays = 7;
    let monetaryPenalty = 0;
    let reputationImpact = 0.3;
    
    const violationTypes = {
        inappropriate_behavior: {
            severity: 'severe',
            suspensionDays: 30,
            reason: 'Comportamiento inapropiado con cliente',
            reputationImpact: 0.8
        },
        fake_profile: {
            severity: 'severe',
            suspensionDays: 60,
            reason: 'Información falsa en el perfil',
            reputationImpact: 1.0
        },
        price_manipulation: {
            severity: 'moderate',
            suspensionDays: 14,
            reason: 'Manipulación de precios fuera de la plataforma',
            reputationImpact: 0.4
        },
        spam_solicitation: {
            severity: 'minor',
            suspensionDays: 3,
            reason: 'Solicitud de contacto fuera de la plataforma',
            reputationImpact: 0.2
        },
        hygiene_standards: {
            severity: 'moderate',
            suspensionDays: 7,
            reason: 'Incumplimiento de estándares de higiene',
            reputationImpact: 0.3
        }
    };
    
    const violation = violationTypes[violationType] || violationTypes.spam_solicitation;
    
    // Escalar por reincidencia
    if (policyViolations >= 2) {
        violation.severity = 'severe';
        violation.suspensionDays *= 2;
        violation.reputationImpact = Math.min(violation.reputationImpact * 1.5, 1.0);
    }
    
    return {
        type: 'policy_violation',
        severity: violation.severity,
        monetaryAmount: monetaryPenalty,
        suspensionDays: violation.suspensionDays,
        reputationImpact: violation.reputationImpact,
        reason: violation.reason,
        description: `Violación de política: ${violationType}. ${details.description || ''}`,
        autoApplied: false, // Siempre requiere revisión manual
        violationDetails: {
            type: violationType,
            previousViolations: policyViolations,
            evidence: details.evidence || [],
            reportedBy: details.reportedBy
        }
    };
};

/**
 * Calcular impacto total en el barbero
 * @param {Object} barber - Datos del barbero
 * @param {Object} penaltyData - Datos de la penalización
 * @returns {Object} Impacto calculado
 */
const calculateBarberImpact = (barber, penaltyData) => {
    const currentReliability = barber.stats?.reliabilityScore || 5.0;
    const currentRating = barber.stats?.rating || 5.0;
    
    // Calcular nuevo score de confiabilidad
    const newReliability = Math.max(
        currentReliability - penaltyData.reputationImpact,
        1.0
    );
    
    // Determinar nuevo estado del barbero
    let newStatus = barber.accountStatus?.status || 'active';
    let suspendedUntil = null;
    
    if (penaltyData.suspensionDays > 0) {
        newStatus = 'suspended';
        suspendedUntil = new Date(Date.now() + penaltyData.suspensionDays * 24 * 60 * 60 * 1000);
    }
    
    // Calcular impacto en visibilidad
    let visibilityImpact = 0;
    if (penaltyData.severity === 'severe') {
        visibilityImpact = 0.5; // 50% menos visible en búsquedas
    } else if (penaltyData.severity === 'moderate') {
        visibilityImpact = 0.2; // 20% menos visible
    }
    
    return {
        previousReliability: currentReliability,
        newReliability,
        reliabilityChange: newReliability - currentReliability,
        previousStatus: barber.accountStatus?.status || 'active',
        newStatus,
        suspendedUntil,
        visibilityImpact,
        estimatedRevenueImpact: calculateRevenueImpact(barber, penaltyData),
        recommendedActions: generateRecommendations(penaltyData)
    };
};

/**
 * Calcular impacto estimado en ingresos
 * @param {Object} barber - Datos del barbero
 * @param {Object} penaltyData - Datos de la penalización
 * @returns {Object} Impacto en ingresos
 */
const calculateRevenueImpact = (barber, penaltyData) => {
    const avgMonthlyRevenue = barber.stats?.averageMonthlyRevenue || 0;
    const avgDailyRevenue = avgMonthlyRevenue / 30;
    
    let revenueImpact = {
        immediate: penaltyData.monetaryAmount || 0,
        suspension: penaltyData.suspensionDays * avgDailyRevenue,
        visibility: 0,
        total: 0
    };
    
    // Impacto por reducción de visibilidad (estimado para 30 días)
    if (penaltyData.severity === 'severe') {
        revenueImpact.visibility = avgMonthlyRevenue * 0.3; // 30% menos reservas
    } else if (penaltyData.severity === 'moderate') {
        revenueImpact.visibility = avgMonthlyRevenue * 0.1; // 10% menos reservas
    }
    
    revenueImpact.total = revenueImpact.immediate + revenueImpact.suspension + revenueImpact.visibility;
    
    return revenueImpact;
};

/**
 * Generar recomendaciones para el barbero
 * @param {Object} penaltyData - Datos de la penalización
 * @returns {Array} Lista de recomendaciones
 */
const generateRecommendations = (penaltyData) => {
    const recommendations = [];
    
    switch (penaltyData.type) {
        case 'no_show':
            recommendations.push(
                'Confirma siempre tus citas 1 hora antes',
                'Configura recordatorios en tu calendario',
                'Comunica cualquier problema con anticipación',
                'Mantén actualizada tu disponibilidad'
            );
            break;
            
        case 'late_cancellation':
            recommendations.push(
                'Cancela con al menos 2 horas de anticipación',
                'Revisa tu agenda diariamente',
                'Bloquea tiempo entre citas para imprevistos',
                'Comunica cambios de horario inmediatamente'
            );
            break;
            
        case 'rejection':
            recommendations.push(
                'Mantén tu calendario actualizado',
                'Acepta solo las citas que puedas cumplir',
                'Reduce tu disponibilidad si estás sobrecargado',
                'Comunica tus horarios reales de trabajo'
            );
            break;
            
        case 'poor_service':
            recommendations.push(
                'Solicita feedback después de cada servicio',
                'Revisa las reseñas y aprende de ellas',
                'Considera capacitación adicional',
                'Mejora la comunicación con los clientes'
            );
            break;
            
        case 'policy_violation':
            recommendations.push(
                'Revisa los términos y condiciones de la plataforma',
                'Mantén la comunicación dentro de la app',
                'Respeta las políticas de precios',
                'Proporciona información veraz en tu perfil'
            );
            break;
    }
    
    return recommendations;
};

/**
 * Determinar si una penalización es apelable
 * @param {Object} penaltyData - Datos de la penalización
 * @param {Object} circumstances - Circunstancias especiales
 * @returns {Object} Información sobre apelabilidad
 */
const calculateAppealEligibility = (penaltyData, circumstances = {}) => {
    let isAppealable = true;
    let appealReasons = [];
    let appealDeadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días
    
    // Circunstancias que hacen apelable una penalización
    const validAppealReasons = {
        medical_emergency: 'Emergencia médica comprobada',
        family_emergency: 'Emergencia familiar',
        technical_issues: 'Problemas técnicos de la plataforma',
        client_no_show: 'Cliente no se presentó',
        incorrect_cancellation: 'Cancelación marcada incorrectamente',
        force_majeure: 'Caso de fuerza mayor'
    };
    
    // Determinar razones válidas según el tipo de penalización
    switch (penaltyData.type) {
        case 'no_show':
            appealReasons = ['medical_emergency', 'family_emergency', 'technical_issues', 'client_no_show'];
            break;
        case 'late_cancellation':
            appealReasons = ['medical_emergency', 'family_emergency', 'force_majeure'];
            break;
        case 'rejection':
            appealReasons = ['technical_issues', 'incorrect_cancellation'];
            break;
        case 'poor_service':
            appealReasons = ['technical_issues', 'client_no_show'];
            isAppealable = penaltyData.severity !== 'severe'; // Severe no es apelable
            break;
        case 'policy_violation':
            isAppealable = false; // Violaciones de política no son apelables
            break;
    }
    
    return {
        isAppealable,
        appealDeadline,
        validReasons: appealReasons.map(reason => ({
            code: reason,
            description: validAppealReasons[reason]
        })),
        evidenceRequired: getRequiredEvidence(penaltyData.type),
        appealProcess: getAppealProcess(penaltyData.severity)
    };
};

/**
 * Obtener evidencia requerida para apelación
 * @param {string} penaltyType - Tipo de penalización
 * @returns {Array} Lista de evidencia requerida
 */
const getRequiredEvidence = (penaltyType) => {
    const evidenceMap = {
        'no_show': [
            'Comprobante médico (si aplica)',
            'Screenshots de comunicación con cliente',
            'Prueba de problema técnico',
            'Testigos o referencias'
        ],
        'late_cancellation': [
            'Comprobante de emergencia',
            'Documentación médica',
            'Prueba de fuerza mayor'
        ],
        'rejection': [
            'Screenshots de errores técnicos',
            'Historial de disponibilidad',
            'Comunicaciones con soporte'
        ],
        'poor_service': [
            'Fotos del trabajo realizado',
            'Comunicación con el cliente',
            'Testigos del servicio'
        ]
    };
    
    return evidenceMap[penaltyType] || [];
};

/**
 * Obtener proceso de apelación según severidad
 * @param {string} severity - Severidad de la penalización
 * @returns {Object} Información del proceso
 */
const getAppealProcess = (severity) => {
    const processes = {
        'minor': {
            reviewTime: '24-48 horas',
            reviewer: 'Supervisor de calidad',
            autoApprovalChance: 'Alta para razones válidas'
        },
        'moderate': {
            reviewTime: '2-3 días hábiles',
            reviewer: 'Gerente de operaciones',
            autoApprovalChance: 'Media con evidencia sólida'
        },
        'severe': {
            reviewTime: '3-5 días hábiles',
            reviewer: 'Comité de revisión',
            autoApprovalChance: 'Baja, requiere evidencia excepcional'
        }
    };
    
    return processes[severity] || processes['minor'];
};

/**
 * Calcular penalización acumulativa basada en historial
 * @param {Array} penaltyHistory - Historial de penalizaciones
 * @param {Object} newPenalty - Nueva penalización
 * @returns {Object} Penalización ajustada
 */
const calculateCumulativePenalty = (penaltyHistory, newPenalty) => {
    const recentPenalties = penaltyHistory.filter(p => {
        const penaltyDate = new Date(p.createdAt);
        const monthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 3 meses
        return penaltyDate >= monthsAgo && p.status === 'active';
    });
    
    const penaltyScore = recentPenalties.reduce((score, penalty) => {
        const severityWeights = { minor: 1, moderate: 3, severe: 5 };
        return score + (severityWeights[penalty.severity] || 1);
    }, 0);
    
    // Escalación basada en score acumulativo
    let adjustedPenalty = { ...newPenalty };
    
    if (penaltyScore >= 10) {
        // Score alto - escalar severidad
        if (adjustedPenalty.severity === 'minor') {
            adjustedPenalty.severity = 'moderate';
            adjustedPenalty.suspensionDays = Math.max(adjustedPenalty.suspensionDays, 3);
        } else if (adjustedPenalty.severity === 'moderate') {
            adjustedPenalty.severity = 'severe';
            adjustedPenalty.suspensionDays = Math.max(adjustedPenalty.suspensionDays, 14);
        }
        
        adjustedPenalty.monetaryAmount *= 1.5;
        adjustedPenalty.reputationImpact *= 1.3;
        adjustedPenalty.escalation = 'high_risk_barber';
    } else if (penaltyScore >= 5) {
        // Score medio - ligera escalación
        adjustedPenalty.monetaryAmount *= 1.2;
        adjustedPenalty.suspensionDays = Math.max(adjustedPenalty.suspensionDays, 1);
        adjustedPenalty.escalation = 'repeat_offender';
    }
    
    return {
        ...adjustedPenalty,
        cumulativeScore: penaltyScore,
        riskLevel: penaltyScore >= 10 ? 'high' : penaltyScore >= 5 ? 'medium' : 'low',
        recentPenalties: recentPenalties.length
    };
};

/**
 * Validar si una penalización debe aplicarse
 * @param {Object} penaltyData - Datos de la penalización
 * @param {Object} context - Contexto adicional
 * @returns {Object} Resultado de validación
 */
const validatePenaltyApplication = (penaltyData, context = {}) => {
    const validationErrors = [];
    const warnings = [];
    
    // Validaciones básicas
    if (!penaltyData.type) {
        validationErrors.push('Tipo de penalización requerido');
    }
    
    if (!penaltyData.reason) {
        validationErrors.push('Razón de penalización requerida');
    }
    
    if (penaltyData.monetaryAmount < 0) {
        validationErrors.push('Monto monetario no puede ser negativo');
    }
    
    if (penaltyData.suspensionDays < 0) {
        validationErrors.push('Días de suspensión no pueden ser negativos');
    }
    
    // Validaciones de contexto
    if (context.barberStatus === 'suspended') {
        warnings.push('Barbero ya está suspendido');
    }
    
    if (context.recentPenalties >= 3) {
        warnings.push('Barbero tiene múltiples penalizaciones recientes');
    }
    
    if (penaltyData.severity === 'severe' && !context.adminApproval) {
        validationErrors.push('Penalizaciones severas requieren aprobación de administrador');
    }
    
    return {
        isValid: validationErrors.length === 0,
        errors: validationErrors,
        warnings,
        canApply: validationErrors.length === 0,
        requiresManualReview: warnings.length > 0 || penaltyData.severity === 'severe'
    };
};

module.exports = {
    calculateNoShowPenalty,
    calculateLateCancellationPenalty,
    calculateRejectionPenalty,
    calculatePoorServicePenalty,
    calculatePolicyViolationPenalty,
    calculateBarberImpact,
    calculateRevenueImpact,
    generateRecommendations,
    calculateAppealEligibility,
    getRequiredEvidence,
    getAppealProcess,
    calculateCumulativePenalty,
    validatePenaltyApplication
};
