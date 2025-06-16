const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Barber = require('../models/Barber');
const config = require('../config/config');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * @desc    Registrar nuevo usuario (cliente)
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = asyncHandler(async (req, res) => {
    const {
        email,
        password,
        firstName,
        lastName,
        phone,
        address,
        coordinates,
        dateOfBirth,
        gender
    } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
        return res.status(400).json({
            success: false,
            error: 'El email ya está registrado',
            code: 'EMAIL_ALREADY_EXISTS',
            message: 'Ya existe una cuenta con este email'
        });
    }

    // Verificar si el teléfono ya está en uso
    if (phone) {
        const existingPhone = await User.findOne({ 'profile.phone': phone });
        if (existingPhone) {
            return res.status(400).json({
                success: false,
                error: 'El teléfono ya está registrado',
                code: 'PHONE_ALREADY_EXISTS',
                message: 'Ya existe una cuenta con este número de teléfono'
            });
        }
    }

    // Crear nuevo usuario
    const user = await User.create({
        email: email.toLowerCase(),
        password,
        role: 'client',
        profile: {
            firstName,
            lastName,
            phone,
            address: address ? {
                street: address.street,
                city: address.city,
                region: address.region,
                country: address.country || 'Chile',
                postalCode: address.postalCode
            } : undefined,
            coordinates: coordinates || undefined,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
            gender
        },
        verification: {
            emailVerified: false,
            emailVerificationToken: crypto.randomBytes(32).toString('hex'),
            emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000 // 24 horas
        }
    });

    // Generar token JWT
    const token = user.generateAuthToken();

    // Configurar cookie
    const cookieOptions = {
        ...config.JWT_COOKIE,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días
    };

    // Log del registro
    console.log(`👤 Nuevo usuario registrado: ${user.email}`);

    // TODO: Enviar email de verificación
    // await sendVerificationEmail(user.email, user.verification.emailVerificationToken);

    res.status(201)
        .cookie('auth_token', token, cookieOptions)
        .json({
            success: true,
            message: 'Usuario registrado exitosamente',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                    profile: user.profile,
                    isVerified: user.verification.emailVerified
                },
                token,
                needsVerification: !user.verification.emailVerified
            }
        });
});

/**
 * @desc    Registrar nuevo barbero
 * @route   POST /api/auth/register-barber
 * @access  Public
 */
const registerBarber = asyncHandler(async (req, res) => {
    const {
        email,
        password,
        firstName,
        lastName,
        phone,
        businessName,
        whatsapp,
        serviceType,
        address,
        coordinates,
        city,
        region
    } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
        return res.status(400).json({
            success: false,
            error: 'El email ya está registrado',
            code: 'EMAIL_ALREADY_EXISTS'
        });
    }

    // Verificar si el teléfono ya está en uso
    if (phone) {
        const existingPhone = await User.findOne({ 'profile.phone': phone });
        if (existingPhone) {
            return res.status(400).json({
                success: false,
                error: 'El teléfono ya está registrado',
                code: 'PHONE_ALREADY_EXISTS'
            });
        }
    }

    // Verificar si el WhatsApp ya está en uso
    const existingWhatsApp = await Barber.findOne({ whatsapp });
    if (existingWhatsApp) {
        return res.status(400).json({
            success: false,
            error: 'El WhatsApp ya está registrado',
            code: 'WHATSAPP_ALREADY_EXISTS'
        });
    }

    // Crear usuario
    const user = await User.create({
        email: email.toLowerCase(),
        password,
        role: 'barber',
        profile: {
            firstName,
            lastName,
            phone,
            coordinates: coordinates || undefined
        },
        verification: {
            emailVerified: false,
            emailVerificationToken: crypto.randomBytes(32).toString('hex'),
            emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000
        }
    });

    // Crear perfil de barbero (inactivo hasta verificación)
    const barber = await Barber.create({
        userId: user._id,
        businessName,
        serviceType,
        location: {
            address,
            coordinates,
            details: {
                city,
                region,
                country: 'Chile'
            }
        },
        services: {
            corteHombre: {
                price: 0, // Se configurará después
                available: false
            },
            corteBarba: {
                price: 0, // Se configurará después
                available: false
            }
        },
        whatsapp,
        isActive: false, // Inactivo hasta completar perfil
        verification: {
            isVerified: false,
            verificationStatus: 'pending'
        }
    });

    // Generar token JWT
    const token = user.generateAuthToken();

    // Log del registro
    console.log(`💇‍♂️ Nuevo barbero registrado: ${user.email} - ${businessName}`);

    res.status(201).json({
        success: true,
        message: 'Barbero registrado exitosamente',
        data: {
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                profile: user.profile
            },
            barber: {
                id: barber._id,
                businessName: barber.businessName,
                isActive: barber.isActive,
                isVerified: barber.verification.isVerified
            },
            token,
            nextSteps: [
                'Verificar email',
                'Completar perfil de servicios',
                'Subir imágenes de verificación',
                'Esperar aprobación'
            ]
        }
    });
});

/**
 * @desc    Iniciar sesión
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
    const { email, password, rememberMe = false } = req.body;

    // Validar entrada
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            error: 'Email y contraseña son requeridos',
            code: 'MISSING_CREDENTIALS'
        });
    }

    // Buscar usuario con contraseña
    const user = await User.findByEmail(email);
    if (!user) {
        return res.status(401).json({
            success: false,
            error: 'Credenciales inválidas',
            code: 'INVALID_CREDENTIALS',
            message: 'Email o contraseña incorrectos'
        });
    }

    // Verificar si la cuenta está bloqueada
    if (user.isLocked()) {
        return res.status(423).json({
            success: false,
            error: 'Cuenta bloqueada',
            code: 'ACCOUNT_LOCKED',
            message: 'Cuenta bloqueada por intentos fallidos. Intente más tarde.',
            lockedUntil: user.loginAttempts.lockedUntil
        });
    }

    // Verificar contraseña
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
        // Incrementar intentos fallidos
        await user.incrementLoginAttempts();
        
        return res.status(401).json({
            success: false,
            error: 'Credenciales inválidas',
            code: 'INVALID_CREDENTIALS',
            message: 'Email o contraseña incorrectos'
        });
    }

    // Verificar si la cuenta está activa
    if (!user.isActive) {
        return res.status(403).json({
            success: false,
            error: 'Cuenta desactivada',
            code: 'ACCOUNT_INACTIVE',
            message: 'Su cuenta ha sido desactivada'
        });
    }

    // Verificar si está suspendido
    if (user.isSuspended) {
        const suspensionMessage = user.suspensionExpires && user.suspensionExpires > new Date() ?
            `Cuenta suspendida hasta ${user.suspensionExpires.toLocaleDateString('es-CL')}` :
            'Cuenta suspendida indefinidamente';
            
        return res.status(403).json({
            success: false,
            error: 'Cuenta suspendida',
            code: 'ACCOUNT_SUSPENDED',
            message: suspensionMessage,
            suspensionExpires: user.suspensionExpires
        });
    }

    // Login exitoso - resetear intentos fallidos
    await user.resetLoginAttempts();

    // Generar token con duración basada en "recordarme"
    const tokenExpires = rememberMe ? '30d' : '7d';
    const token = jwt.sign(
        { 
            userId: user._id, 
            email: user.email, 
            role: user.role 
        },
        config.JWT_SECRET,
        { expiresIn: tokenExpires }
    );

    // Configurar cookie
    const cookieOptions = {
        ...config.JWT_COOKIE,
        expires: new Date(Date.now() + (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000)
    };

    // Obtener información adicional si es barbero
    let barberInfo = null;
    if (user.role === 'barber') {
        const barber = await Barber.findOne({ userId: user._id });
        if (barber) {
            barberInfo = {
                id: barber._id,
                businessName: barber.businessName,
                isActive: barber.isActive,
                isVerified: barber.verification.isVerified,
                penalties: barber.penalties
            };
        }
    }

    // Log del login
    const ip = req.ip || req.connection.remoteAddress;
    console.log(`🔐 Login exitoso: ${user.email} desde ${ip}`);

    res.status(200)
        .cookie('auth_token', token, cookieOptions)
        .json({
            success: true,
            message: 'Inicio de sesión exitoso',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                    profile: user.profile,
                    isVerified: user.verification.emailVerified,
                    lastLogin: user.lastLogin
                },
                barber: barberInfo,
                token,
                expiresIn: tokenExpires
            }
        });
});

/**
 * @desc    Cerrar sesión
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
    // Limpiar cookie
    res.clearCookie('auth_token');

    // Log del logout
    console.log(`👋 Logout: ${req.user?.email || 'Unknown'}`);

    res.status(200).json({
        success: true,
        message: 'Sesión cerrada exitosamente'
    });
});

/**
 * @desc    Obtener usuario actual
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    
    if (!user) {
        return res.status(404).json({
            success: false,
            error: 'Usuario no encontrado',
            code: 'USER_NOT_FOUND'
        });
    }

    // Obtener información adicional si es barbero
    let barberInfo = null;
    if (user.role === 'barber') {
        const barber = await Barber.findOne({ userId: user._id });
        if (barber) {
            barberInfo = {
                id: barber._id,
                businessName: barber.businessName,
                isActive: barber.isActive,
                isVerified: barber.verification.isVerified,
                services: barber.services,
                stats: barber.stats,
                penalties: barber.penalties
            };
        }
    }

    res.status(200).json({
        success: true,
        data: {
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                profile: user.profile,
                isVerified: user.verification.emailVerified,
                preferences: user.preferences,
                stats: user.stats,
                lastLogin: user.lastLogin,
                createdAt: user.createdAt
            },
            barber: barberInfo
        }
    });
});

/**
 * @desc    Verificar email
 * @route   GET /api/auth/verify-email/:token
 * @access  Public
 */
const verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.params;

    if (!token) {
        return res.status(400).json({
            success: false,
            error: 'Token de verificación requerido',
            code: 'MISSING_TOKEN'
        });
    }

    // Buscar usuario con el token
    const user = await User.findOne({
        'verification.emailVerificationToken': token,
        'verification.emailVerificationExpires': { $gt: Date.now() }
    });

    if (!user) {
        return res.status(400).json({
            success: false,
            error: 'Token de verificación inválido o expirado',
            code: 'INVALID_TOKEN'
        });
    }

    // Marcar email como verificado
    user.verification.emailVerified = true;
    user.verification.emailVerificationToken = undefined;
    user.verification.emailVerificationExpires = undefined;
    
    await user.save();

    console.log(`✅ Email verificado: ${user.email}`);

    res.status(200).json({
        success: true,
        message: 'Email verificado exitosamente',
        data: {
            user: {
                id: user._id,
                email: user.email,
                isVerified: true
            }
        }
    });
});

/**
 * @desc    Reenviar email de verificación
 * @route   POST /api/auth/resend-verification
 * @access  Private
 */
const resendVerification = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            error: 'Usuario no encontrado',
            code: 'USER_NOT_FOUND'
        });
    }

    if (user.verification.emailVerified) {
        return res.status(400).json({
            success: false,
            error: 'El email ya está verificado',
            code: 'ALREADY_VERIFIED'
        });
    }

    // Generar nuevo token
    user.verification.emailVerificationToken = crypto.randomBytes(32).toString('hex');
    user.verification.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
    
    await user.save();

    // TODO: Enviar nuevo email
    // await sendVerificationEmail(user.email, user.verification.emailVerificationToken);

    console.log(`📧 Reenvío de verificación: ${user.email}`);

    res.status(200).json({
        success: true,
        message: 'Email de verificación reenviado'
    });
});

/**
 * @desc    Solicitar reset de contraseña
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            success: false,
            error: 'Email es requerido',
            code: 'MISSING_EMAIL'
        });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
        // Por seguridad, responder exitosamente aunque el usuario no exista
        return res.status(200).json({
            success: true,
            message: 'Si el email existe, recibirá instrucciones para resetear su contraseña'
        });
    }

    // Generar token de reset
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // TODO: Enviar email con token
    // await sendPasswordResetEmail(user.email, resetToken);

    console.log(`🔐 Reset solicitado: ${user.email}`);

    res.status(200).json({
        success: true,
        message: 'Instrucciones enviadas al email'
    });
});

/**
 * @desc    Resetear contraseña
 * @route   PUT /api/auth/reset-password/:token
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({
            success: false,
            error: 'Nueva contraseña es requerida',
            code: 'MISSING_PASSWORD'
        });
    }

    // Hash del token para comparar
    const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

    // Buscar usuario con token válido
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
        return res.status(400).json({
            success: false,
            error: 'Token inválido o expirado',
            code: 'INVALID_RESET_TOKEN'
        });
    }

    // Establecer nueva contraseña
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    
    await user.save();

    // Generar nuevo token JWT
    const authToken = user.generateAuthToken();

    console.log(`🔑 Contraseña reseteada: ${user.email}`);

    res.status(200).json({
        success: true,
        message: 'Contraseña actualizada exitosamente',
        data: {
            token: authToken
        }
    });
});

/**
 * @desc    Cambiar contraseña (usuario autenticado)
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({
            success: false,
            error: 'Contraseña actual y nueva son requeridas',
            code: 'MISSING_PASSWORDS'
        });
    }

    // Obtener usuario con contraseña
    const user = await User.findById(req.user.id).select('+password');

    // Verificar contraseña actual
    const isCurrentPasswordCorrect = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordCorrect) {
        return res.status(400).json({
            success: false,
            error: 'Contraseña actual incorrecta',
            code: 'INCORRECT_CURRENT_PASSWORD'
        });
    }

    // Actualizar contraseña
    user.password = newPassword;
    await user.save();

    console.log(`🔐 Contraseña cambiada: ${user.email}`);

    res.status(200).json({
        success: true,
        message: 'Contraseña actualizada exitosamente'
    });
});

/**
 * @desc    Verificar código de teléfono
 * @route   POST /api/auth/verify-phone
 * @access  Private
 */
const verifyPhone = asyncHandler(async (req, res) => {
    const { code } = req.body;

    if (!code) {
        return res.status(400).json({
            success: false,
            error: 'Código de verificación requerido',
            code: 'MISSING_CODE'
        });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            error: 'Usuario no encontrado',
            code: 'USER_NOT_FOUND'
        });
    }

    // Verificar código y expiración
    if (user.verification.phoneVerificationCode !== code) {
        return res.status(400).json({
            success: false,
            error: 'Código de verificación inválido',
            code: 'INVALID_CODE'
        });
    }

    if (user.verification.phoneVerificationExpires < Date.now()) {
        return res.status(400).json({
            success: false,
            error: 'Código de verificación expirado',
            code: 'EXPIRED_CODE'
        });
    }

    // Marcar teléfono como verificado
    user.verification.phoneVerified = true;
    user.verification.phoneVerificationCode = undefined;
    user.verification.phoneVerificationExpires = undefined;
    user.verification.phoneVerificationAttempts = 0;
    
    await user.save();

    console.log(`📱 Teléfono verificado: ${user.profile.phone}`);

    res.status(200).json({
        success: true,
        message: 'Teléfono verificado exitosamente'
    });
});

/**
 * @desc    Solicitar código de verificación de teléfono
 * @route   POST /api/auth/request-phone-verification
 * @access  Private
 */
const requestPhoneVerification = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            error: 'Usuario no encontrado',
            code: 'USER_NOT_FOUND'
        });
    }

    if (!user.profile.phone) {
        return res.status(400).json({
            success: false,
            error: 'Número de teléfono no configurado',
            code: 'NO_PHONE_NUMBER'
        });
    }

    if (user.verification.phoneVerified) {
        return res.status(400).json({
            success: false,
            error: 'Teléfono ya verificado',
            code: 'ALREADY_VERIFIED'
        });
    }

    // Verificar límite de intentos
    if (user.verification.phoneVerificationAttempts >= 5) {
        return res.status(429).json({
            success: false,
            error: 'Demasiados intentos',
            code: 'TOO_MANY_ATTEMPTS',
            message: 'Demasiados intentos de verificación. Intente más tarde.'
        });
    }

    // Generar código
    const verificationCode = user.generatePhoneVerificationCode();
    await user.save();

    // TODO: Enviar SMS con código
    // await sendSMSVerification(user.profile.phone, verificationCode);

    console.log(`📲 Código enviado a: ${user.profile.phone}`);

    res.status(200).json({
        success: true,
        message: 'Código de verificación enviado',
        data: {
            phone: user.profile.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'), // Ocultar parte del número
            expiresIn: 15 // minutos
        }
    });
});

/**
 * @desc    Refrescar token
 * @route   POST /api/auth/refresh
 * @access  Private
 */
const refreshToken = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);

    if (!user) {
        return res.status(404).json({
            success: false,
            error: 'Usuario no encontrado',
            code: 'USER_NOT_FOUND'
        });
    }

    // Generar nuevo token
    const token = user.generateAuthToken();

    res.status(200).json({
        success: true,
        message: 'Token refrescado exitosamente',
        data: {
            token,
            expiresIn: config.JWT_EXPIRE
        }
    });
});

module.exports = {
    registerUser,
    registerBarber,
    login,
    logout,
    getMe,
    verifyEmail,
    resendVerification,
    forgotPassword,
    resetPassword,
    changePassword,
    verifyPhone,
    requestPhoneVerification,
    refreshToken
};
