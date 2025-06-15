const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const config = require('../config/config');
const crypto = require('crypto');

/**
 * Configuración de almacenamiento con nombres únicos
 */
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadPath = '';
        
        // Determinar directorio según el tipo de upload
        switch (file.fieldname) {
            case 'avatar':
            case 'profileImage':
                uploadPath = path.join(config.UPLOAD_CONFIG.uploadDir, 'profiles');
                break;
            case 'galleryImages':
            case 'portfolioImages':
                uploadPath = path.join(config.UPLOAD_CONFIG.uploadDir, 'galleries');
                break;
            case 'ciImages':
            case 'verificationImages':
                uploadPath = path.join(config.UPLOAD_CONFIG.uploadDir, 'verification');
                break;
            case 'reviewImages':
                uploadPath = path.join(config.UPLOAD_CONFIG.uploadDir, 'reviews');
                break;
            default:
                uploadPath = path.join(config.UPLOAD_CONFIG.uploadDir, 'temp');
        }
        
        // Crear directorio si no existe
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
    },
    
    filename: function (req, file, cb) {
        // Generar nombre único
        const uniqueSuffix = crypto.randomBytes(16).toString('hex');
        const timestamp = Date.now();
        const ext = path.extname(file.originalname).toLowerCase();
        
        // Formato: timestamp_uniqueid_original.ext
        const filename = `${timestamp}_${uniqueSuffix}${ext}`;
        
        cb(null, filename);
    }
});

/**
 * Filtro de archivos - solo imágenes
 */
const fileFilter = (req, file, cb) => {
    // Verificar tipo MIME
    if (!config.UPLOAD_CONFIG.allowedMimeTypes.includes(file.mimetype)) {
        const error = new Error(`Tipo de archivo no permitido: ${file.mimetype}`);
        error.code = 'INVALID_FILE_TYPE';
        error.allowedTypes = config.UPLOAD_CONFIG.allowedMimeTypes;
        return cb(error, false);
    }
    
    // Verificar extensión
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    
    if (!allowedExtensions.includes(ext)) {
        const error = new Error(`Extensión de archivo no permitida: ${ext}`);
        error.code = 'INVALID_FILE_EXTENSION';
        error.allowedExtensions = allowedExtensions;
        return cb(error, false);
    }
    
    cb(null, true);
};

/**
 * Configuración base de multer
 */
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB por defecto
        files: 10 // Máximo 10 archivos
    }
});

/**
 * Middleware para subir avatar de perfil
 */
const uploadProfileImage = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: config.UPLOAD_CONFIG.maxFileSizes.profile,
        files: 1
    }
}).single('avatar');

/**
 * Middleware para subir imágenes de galería
 */
const uploadGalleryImages = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: config.UPLOAD_CONFIG.maxFileSizes.gallery,
        files: 10
    }
}).array('galleryImages', 10);

/**
 * Middleware para subir imágenes de verificación (CI)
 */
const uploadVerificationImages = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: config.UPLOAD_CONFIG.maxFileSizes.verification,
        files: 2
    }
}).fields([
    { name: 'ciFront', maxCount: 1 },
    { name: 'ciBack', maxCount: 1 }
]);

/**
 * Middleware para subir imágenes de reseñas
 */
const uploadReviewImages = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: config.UPLOAD_CONFIG.maxFileSizes.review,
        files: config.REVIEW_CONFIG.maxPhotos
    }
}).array('reviewImages', config.REVIEW_CONFIG.maxPhotos);

/**
 * Middleware para procesar y optimizar imágenes
 */
const processImages = async (req, res, next) => {
    try {
        if (!req.file && !req.files) {
            return next();
        }
        
        const filesToProcess = [];
        
        // Recopilar archivos a procesar
        if (req.file) {
            filesToProcess.push(req.file);
        }
        
        if (req.files) {
            if (Array.isArray(req.files)) {
                filesToProcess.push(...req.files);
            } else {
                // req.files es un objeto con campos
                Object.values(req.files).forEach(fileArray => {
                    filesToProcess.push(...fileArray);
                });
            }
        }
        
        // Procesar cada imagen
        for (const file of filesToProcess) {
            await processImageFile(file);
        }
        
        next();
    } catch (error) {
        console.error('Error procesando imágenes:', error);
        
        // Limpiar archivos en caso de error
        cleanupFiles(req);
        
        return res.status(500).json({
            success: false,
            error: 'Error procesando imágenes',
            code: 'IMAGE_PROCESSING_ERROR',
            message: error.message
        });
    }
};

/**
 * Procesar archivo de imagen individual
 * @param {Object} file - Archivo multer
 */
const processImageFile = async (file) => {
    try {
        const inputPath = file.path;
        const outputPath = inputPath.replace(/\.[^/.]+$/, '_processed' + path.extname(inputPath));
        
        // Obtener información de la imagen
        const metadata = await sharp(inputPath).metadata();
        
        // Configurar procesamiento según el tipo
        let sharpInstance = sharp(inputPath);
        
        // Rotar automáticamente según EXIF
        sharpInstance = sharpInstance.rotate();
        
        // Redimensionar según el tipo de imagen
        switch (file.fieldname) {
            case 'avatar':
            case 'profileImage':
                sharpInstance = sharpInstance
                    .resize(400, 400, { 
                        fit: 'cover',
                        position: 'center'
                    });
                break;
                
            case 'galleryImages':
            case 'portfolioImages':
                sharpInstance = sharpInstance
                    .resize(1200, 800, { 
                        fit: 'inside',
                        withoutEnlargement: true
                    });
                break;
                
            case 'ciFront':
            case 'ciBack':
            case 'verificationImages':
                sharpInstance = sharpInstance
                    .resize(1600, 1200, { 
                        fit: 'inside',
                        withoutEnlargement: true
                    });
                break;
                
            case 'reviewImages':
                sharpInstance = sharpInstance
                    .resize(800, 600, { 
                        fit: 'inside',
                        withoutEnlargement: true
                    });
                break;
                
            default:
                sharpInstance = sharpInstance
                    .resize(1200, 1200, { 
                        fit: 'inside',
                        withoutEnlargement: true
                    });
        }
        
        // Aplicar optimizaciones
        sharpInstance = sharpInstance
            .jpeg({ 
                quality: 85,
                progressive: true,
                mozjpeg: true
            })
            .png({ 
                quality: 85,
                compressionLevel: 8
            })
            .webp({ 
                quality: 85
            });
        
        // Procesar y guardar
        await sharpInstance.toFile(outputPath);
        
        // Reemplazar archivo original con el procesado
        fs.unlinkSync(inputPath);
        fs.renameSync(outputPath, inputPath);
        
        // Actualizar información del archivo
        const stats = fs.statSync(inputPath);
        file.size = stats.size;
        
        // Agregar metadata de imagen
        file.imageMetadata = {
            width: metadata.width,
            height: metadata.height,
            format: metadata.format,
            hasAlpha: metadata.hasAlpha,
            density: metadata.density,
            isAnimated: metadata.pages > 1
        };
        
        console.log(`📸 Imagen procesada: ${file.filename} (${file.size} bytes)`);
        
    } catch (error) {
        console.error(`Error procesando imagen ${file.filename}:`, error);
        throw error;
    }
};

/**
 * Middleware para validar imágenes antes del upload
 */
const validateImages = (req, res, next) => {
    const errors = [];
    
    // Validar número de archivos
    if (req.files && Array.isArray(req.files)) {
        const maxFiles = getMaxFilesForField(req.files[0]?.fieldname);
        if (req.files.length > maxFiles) {
            errors.push(`Máximo ${maxFiles} archivos permitidos`);
        }
    }
    
    if (errors.length > 0) {
        cleanupFiles(req);
        return res.status(400).json({
            success: false,
            error: 'Validación de archivos fallida',
            code: 'FILE_VALIDATION_ERROR',
            errors: errors
        });
    }
    
    next();
};

/**
 * Obtener número máximo de archivos según el campo
 * @param {string} fieldname - Nombre del campo
 * @returns {number} - Número máximo de archivos
 */
const getMaxFilesForField = (fieldname) => {
    switch (fieldname) {
        case 'avatar':
        case 'profileImage':
            return 1;
        case 'galleryImages':
        case 'portfolioImages':
            return 10;
        case 'ciFront':
        case 'ciBack':
            return 1;
        case 'reviewImages':
            return config.REVIEW_CONFIG.maxPhotos;
        default:
            return 5;
    }
};

/**
 * Middleware para generar URLs públicas de archivos
 */
const generateFileUrls = (req, res, next) => {
    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        
        if (req.file) {
            req.file.url = `${baseUrl}/${req.file.path.replace(/\\/g, '/')}`;
        }
        
        if (req.files) {
            if (Array.isArray(req.files)) {
                req.files.forEach(file => {
                    file.url = `${baseUrl}/${file.path.replace(/\\/g, '/')}`;
                });
            } else {
                Object.keys(req.files).forEach(fieldName => {
                    req.files[fieldName].forEach(file => {
                        file.url = `${baseUrl}/${file.path.replace(/\\/g, '/')}`;
                    });
                });
            }
        }
        
        next();
    } catch (error) {
        console.error('Error generando URLs:', error);
        next();
    }
};

/**
 * Middleware para limpiar archivos temporales en caso de error
 */
const cleanupFiles = (req) => {
    try {
        const filesToClean = [];
        
        if (req.file) {
            filesToClean.push(req.file.path);
        }
        
        if (req.files) {
            if (Array.isArray(req.files)) {
                filesToClean.push(...req.files.map(f => f.path));
            } else {
                Object.values(req.files).forEach(fileArray => {
                    filesToClean.push(...fileArray.map(f => f.path));
                });
            }
        }
        
        filesToClean.forEach(filePath => {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`🗑️  Archivo limpiado: ${filePath}`);
            }
        });
    } catch (error) {
        console.error('Error limpiando archivos:', error);
    }
};

/**
 * Middleware para manejar errores de multer
 */
const handleUploadErrors = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        cleanupFiles(req);
        
        switch (error.code) {
            case 'LIMIT_FILE_SIZE':
                return res.status(400).json({
                    success: false,
                    error: 'Archivo demasiado grande',
                    code: 'FILE_TOO_LARGE',
                    message: `El archivo excede el tamaño máximo permitido`,
                    maxSize: getMaxSizeForField(error.field)
                });
                
            case 'LIMIT_FILE_COUNT':
                return res.status(400).json({
                    success: false,
                    error: 'Demasiados archivos',
                    code: 'TOO_MANY_FILES',
                    message: `Máximo ${getMaxFilesForField(error.field)} archivos permitidos`
                });
                
            case 'LIMIT_UNEXPECTED_FILE':
                return res.status(400).json({
                    success: false,
                    error: 'Campo de archivo inesperado',
                    code: 'UNEXPECTED_FIELD',
                    message: `Campo '${error.field}' no esperado`
                });
                
            default:
                return res.status(400).json({
                    success: false,
                    error: 'Error de upload',
                    code: 'UPLOAD_ERROR',
                    message: error.message
                });
        }
    }
    
    if (error.code === 'INVALID_FILE_TYPE') {
        cleanupFiles(req);
        return res.status(400).json({
            success: false,
            error: 'Tipo de archivo no válido',
            code: 'INVALID_FILE_TYPE',
            message: error.message,
            allowedTypes: error.allowedTypes
        });
    }
    
    if (error.code === 'INVALID_FILE_EXTENSION') {
        cleanupFiles(req);
        return res.status(400).json({
            success: false,
            error: 'Extensión de archivo no válida',
            code: 'INVALID_FILE_EXTENSION',
            message: error.message,
            allowedExtensions: error.allowedExtensions
        });
    }
    
    next(error);
};

/**
 * Obtener tamaño máximo según el campo
 * @param {string} fieldname - Nombre del campo
 * @returns {string} - Tamaño máximo formateado
 */
const getMaxSizeForField = (fieldname) => {
    const sizes = config.UPLOAD_CONFIG.maxFileSizes;
    
    switch (fieldname) {
        case 'avatar':
        case 'profileImage':
            return formatFileSize(sizes.profile);
        case 'galleryImages':
        case 'portfolioImages':
            return formatFileSize(sizes.gallery);
        case 'ciFront':
        case 'ciBack':
        case 'verificationImages':
            return formatFileSize(sizes.verification);
        case 'reviewImages':
            return formatFileSize(sizes.review);
        default:
            return formatFileSize(5 * 1024 * 1024); // 5MB por defecto
    }
};

/**
 * Formatear tamaño de archivo
 * @param {number} bytes - Tamaño en bytes
 * @returns {string} - Tamaño formateado
 */
const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Middleware para crear thumbnails automáticamente
 */
const createThumbnails = async (req, res, next) => {
    try {
        if (!req.file && !req.files) {
            return next();
        }
        
        const filesToProcess = [];
        
        if (req.file) {
            filesToProcess.push(req.file);
        }
        
        if (req.files) {
            if (Array.isArray(req.files)) {
                filesToProcess.push(...req.files);
            } else {
                Object.values(req.files).forEach(fileArray => {
                    filesToProcess.push(...fileArray);
                });
            }
        }
        
        // Crear thumbnails para imágenes de galería
        for (const file of filesToProcess) {
            if (file.fieldname === 'galleryImages' || file.fieldname === 'portfolioImages') {
                await createThumbnail(file);
            }
        }
        
        next();
    } catch (error) {
        console.error('Error creando thumbnails:', error);
        next(); // Continuar sin thumbnails en caso de error
    }
};

/**
 * Crear thumbnail para una imagen
 * @param {Object} file - Archivo multer
 */
const createThumbnail = async (file) => {
    try {
        const inputPath = file.path;
        const thumbnailPath = inputPath.replace(/(\.[^/.]+)$/, '_thumb$1');
        
        await sharp(inputPath)
            .resize(300, 200, {
                fit: 'cover',
                position: 'center'
            })
            .jpeg({ quality: 80 })
            .toFile(thumbnailPath);
        
        // Agregar información del thumbnail al archivo
        file.thumbnail = {
            path: thumbnailPath,
            url: `${req.protocol}://${req.get('host')}/${thumbnailPath.replace(/\\/g, '/')}`
        };
        
        console.log(`🖼️  Thumbnail creado: ${path.basename(thumbnailPath)}`);
        
    } catch (error) {
        console.error(`Error creando thumbnail para ${file.filename}:`, error);
    }
};

/**
 * Middleware para verificar espacio en disco
 */
const checkDiskSpace = async (req, res, next) => {
    try {
        const stats = fs.statSync(config.UPLOAD_CONFIG.uploadDir);
        const free = stats.free || 1000000000; // 1GB por defecto si no se puede obtener
        
        // Calcular tamaño total de archivos a subir
        let totalSize = 0;
        
        if (req.file) {
            totalSize += req.file.size || 0;
        }
        
        if (req.files) {
            if (Array.isArray(req.files)) {
                totalSize += req.files.reduce((sum, file) => sum + (file.size || 0), 0);
            } else {
                Object.values(req.files).forEach(fileArray => {
                    totalSize += fileArray.reduce((sum, file) => sum + (file.size || 0), 0);
                });
            }
        }
        
        // Verificar que hay suficiente espacio (con 100MB de margen)
        const requiredSpace = totalSize + (100 * 1024 * 1024);
        
        if (free < requiredSpace) {
            cleanupFiles(req);
            return res.status(507).json({
                success: false,
                error: 'Espacio en disco insuficiente',
                code: 'INSUFFICIENT_STORAGE',
                message: 'No hay suficiente espacio para procesar los archivos'
            });
        }
        
        next();
    } catch (error) {
        console.error('Error verificando espacio en disco:', error);
        next(); // Continuar sin verificación en caso de error
    }
};

/**
 * Middleware para logging de uploads
 */
const logUpload = (req, res, next) => {
    if (req.file || req.files) {
        const user = req.user ? `${req.user.email} (${req.user.role})` : 'Anonymous';
        const ip = req.ip || req.connection.remoteAddress;
        
        let fileInfo = '';
        
        if (req.file) {
            fileInfo = `1 archivo: ${req.file.filename} (${formatFileSize(req.file.size)})`;
        } else if (req.files) {
            const fileCount = Array.isArray(req.files) ? 
                req.files.length : 
                Object.values(req.files).reduce((sum, arr) => sum + arr.length, 0);
            fileInfo = `${fileCount} archivos`;
        }
        
        console.log(`📤 Upload: ${user} subió ${fileInfo} desde ${ip}`);
    }
    
    next();
};

/**
 * Middleware para verificar cuota de usuario
 */
const checkUserQuota = async (req, res, next) => {
    try {
        if (!req.user) {
            return next();
        }
        
        // Obtener cuota según el rol
        const quotas = {
            client: 50 * 1024 * 1024,    // 50MB para clientes
            barber: 200 * 1024 * 1024,   // 200MB para barberos
            admin: 1000 * 1024 * 1024    // 1GB para admins
        };
        
        const userQuota = quotas[req.user.role] || quotas.client;
        
        // Calcular uso actual (esto sería más eficiente con una base de datos)
        const userUploadsPath = path.join(config.UPLOAD_CONFIG.uploadDir, 'user_' + req.user.id);
        let currentUsage = 0;
        
        if (fs.existsSync(userUploadsPath)) {
            const files = fs.readdirSync(userUploadsPath, { recursive: true });
            for (const file of files) {
                const filePath = path.join(userUploadsPath, file);
                if (fs.statSync(filePath).isFile()) {
                    currentUsage += fs.statSync(filePath).size;
                }
            }
        }
        
        // Calcular tamaño de nuevos archivos
        let newFilesSize = 0;
        if (req.file) newFilesSize += req.file.size || 0;
        if (req.files) {
            if (Array.isArray(req.files)) {
                newFilesSize += req.files.reduce((sum, f) => sum + (f.size || 0), 0);
            } else {
                Object.values(req.files).forEach(fileArray => {
                    newFilesSize += fileArray.reduce((sum, f) => sum + (f.size || 0), 0);
                });
            }
        }
        
        if (currentUsage + newFilesSize > userQuota) {
            cleanupFiles(req);
            return res.status(413).json({
                success: false,
                error: 'Cuota de almacenamiento excedida',
                code: 'QUOTA_EXCEEDED',
                message: `Cuota máxima: ${formatFileSize(userQuota)}`,
                currentUsage: formatFileSize(currentUsage),
                quota: formatFileSize(userQuota),
                available: formatFileSize(userQuota - currentUsage)
            });
        }
        
        next();
    } catch (error) {
        console.error('Error verificando cuota:', error);
        next(); // Continuar sin verificación en caso de error
    }
};

/**
 * Wrapper para aplicar todos los middlewares de upload en orden
 */
const createUploadMiddleware = (uploadType) => {
    const middlewares = [
        logUpload,
        checkDiskSpace,
        checkUserQuota
    ];
    
    switch (uploadType) {
        case 'profile':
            middlewares.push(uploadProfileImage);
            break;
        case 'gallery':
            middlewares.push(uploadGalleryImages);
            break;
        case 'verification':
            middlewares.push(uploadVerificationImages);
            break;
        case 'review':
            middlewares.push(uploadReviewImages);
            break;
        default:
            middlewares.push(upload.any());
    }
    
    middlewares.push(
        handleUploadErrors,
        validateImages,
        processImages,
        createThumbnails,
        generateFileUrls
    );
    
    return middlewares;
};

module.exports = {
    upload,
    uploadProfileImage,
    uploadGalleryImages,
    uploadVerificationImages,
    uploadReviewImages,
    processImages,
    validateImages,
    generateFileUrls,
    handleUploadErrors,
    createThumbnails,
    checkDiskSpace,
    logUpload,
    checkUserQuota,
    cleanupFiles,
    createUploadMiddleware,
    formatFileSize
};
