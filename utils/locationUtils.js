/**
 * Calcule la distance entre deux points GPS (en km)
 * @param {Number} lat1 - Latitude du point 1
 * @param {Number} lon1 - Longitude du point 1
 * @param {Number} lat2 - Latitude du point 2
 * @param {Number} lon2 - Longitude du point 2
 * @returns {Number} Distance en km
 */
function getDistance(lat1, lon1, lat2, lon2) {
    function toRad(Value) {
        return Value * Math.PI / 180;
    }

    const R = 6371; // Rayon de la Terre en km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance en km
}

module.exports = {
    getDistance
};