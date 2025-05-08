const multer = require('multer');
const path = require('path');

// Set storage for certificates
const certificateStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/certificates/');
    },
    filename: function(req, file, cb) {
        cb(null, `certificate-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`);
    }
});

// Set storage for medicament images
const medicamentStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/medicaments/');
    },
    filename: function(req, file, cb) {
        cb(null, `medicament-${Date.now()}${path.extname(file.originalname)}`);
    }
});

// Check file type
const fileFilter = (req, file, cb) => {
    // Allowed ext
    const filetypes = /jpeg|jpg|png|pdf/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Error: Files can only be images (jpeg, jpg, png) or PDF!'));
    }
};

// Create multer instances
const uploadCertificate = multer({
    storage: certificateStorage,
    limits: { fileSize: 5000000 }, // 5MB
    fileFilter: fileFilter
}).single('certificate');

const uploadMedicamentImage = multer({
    storage: medicamentStorage,
    limits: { fileSize: 5000000 }, // 5MB
    fileFilter: (req, file, cb) => {
        // Only allow image files for medicaments
        const filetypes = /jpeg|jpg|png/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Error: Files can only be images (jpeg, jpg, png)!'));
        }
    }
}).single('image');

module.exports = { uploadCertificate, uploadMedicamentImage };