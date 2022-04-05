const STORAGE_KEY = 'geo-rush.highestScore';

/**
 * @type {number}
 */
export let highestScore;

const storageData = localStorage.getItem(STORAGE_KEY);
if (storageData) {
    highestScore = Number.parseInt(storageData);
    if (Number.isNaN(highestScore)) {
        highestScore = 0;
    }
} else {
    highestScore = 0;
}

/**
 * @param {number} score
 */
export const updateHightestScore = (score) => {
    if (score <= highestScore) {
        return;
    }
    highestScore = score;
    localStorage.setItem(STORAGE_KEY, highestScore.toFixed());
};
