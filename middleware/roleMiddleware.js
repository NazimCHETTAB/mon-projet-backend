const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role ${req.user.role} is not authorized to access this route`
            });
        }

        next();
    };
};

const approvedPharmacist = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route'
        });
    }

    if (req.user.role !== 'pharmacist' || !req.user.isApproved) {
        return res.status(403).json({
            success: false,
            message: 'Only approved pharmacists can access this route'
        });
    }

    next();
};

module.exports = { authorize, approvedPharmacist };