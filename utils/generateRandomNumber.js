/**
 * Generates a random number (or integer) between min and max
 * @param {number} min Minimum number
 * @param {number} max Maximum number
 * @param {boolean} integer Whether to turn the output into an integer
 */
function generateRandomNumber(min, max, integer = true) {
    let num = (Math.random() * (max - min + (integer ? 1 : 0))) + min;
    if (integer) {
        num = Math.floor(num);
    }
    return num
}

module.exports = generateRandomNumber;
