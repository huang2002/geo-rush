import { character, currentScore, setScore } from './character.js';

export const COIN_SPAWN_RATE = 0.2;
export const COIN_HEIGHT = 30;
const COIN_EDGES = 16;
export const COIN_RADIUS = 15;
const COIN_VERTICES = COM.Vertices.createRegularPolygon(
    COIN_EDGES,
    COIN_RADIUS
);

const BONUS_SCORE = 10;
const BONUS_FLOAT_DISTANCE = 50;
const BONUS_ANIMATION_DURATION = 2000;

export const coinPool = new HP.Pool({
    create: () => (
        new POM.BodyNode({
            category: 'coin',
            classNames: ['coin'],
            vertices: COIN_VERTICES,
            collisionFilter: POM.Category.for('character'),
            sensorFilter: POM.Category.for('character'),
            style: {
                strokeStyle: '#FF0',
                lineWidth: 2,
            },
        })
    ),
    clear(coin) {
        coin.listenerMap.clear();
        if (coin.parentNode) {
            coin.parentNode.removeChild(coin);
        }
    },
});

/**
 * @typedef {ReturnType<coinPool['create']>} Coin
 */

export const bonusTextPool = new HP.Pool({
    create: () => (
        new COM.TextNode({
            content: `+${BONUS_SCORE}`,
            style: {
                fillStyle: '#FF0',
                font: 'bold 25px sans-serif',
                textAlign: 'center',
                textBaseline: 'bottom',
            },
        })
    ),
    init(bonusText) {
        bonusText.style.opacity = 1;
    },
    clear(bonusText) {
        if (bonusText.parentNode) {
            bonusText.parentNode.removeChild(bonusText);
        }
    },
});

export const bonusAnimationPool = new HP.Pool({
    create: () => (
        new COM.Animation({
            from: 0,
            to: 1,
            timing: COM.Timing.easeOut,
            duration: BONUS_ANIMATION_DURATION,
        })
    ),
    clear(animation) {
        animation.stop(COM.Schedule.getTimeStamp());
        animation.listenerMap.clear();
    },
});

/**
 * @type {Coin[]}
 */
export let coins = [];

export const updateCoins = () => {
    coins = coins.filter(coin => {
        if (coin.bounds.right >= 0) {
            return true;
        } else {
            coinPool.push(coin);
            return false;
        }
    });
};

/**
 * @type {COM.TextNode<any>[]}
 */
export let bonusTexts = [];

/**
 * @type {COM.Animation[]}
 */
export let bonusAnimations = [];

/**
 * @param {number} x
 * @param {number} y
 * @param {POM.WorldNode<any>} world
 */
export const spawnCoin = (x, y, world) => {

    const coin = coinPool.pop();

    coin.offset.set(x - COIN_RADIUS, y);

    coin.once('collision', (collisionEvent) => {

        const index = coins.indexOf(coin);
        if (index >= 0) {
            HUtils.removeElements(coins, index, 1);
        }

        coinPool.push(coin);

        setScore(currentScore + BONUS_SCORE);

        const bonusText = bonusTextPool.pop();
        bonusText.offset.set(x, y);
        world.insertBefore(character, bonusText);
        bonusTexts.push(bonusText);

        const animation = bonusAnimationPool.pop();
        animation.on('update', (animationUpdateEvent) => {
            const { data: { currentValue } } = animationUpdateEvent;
            bonusText.offset.y = y - currentValue * BONUS_FLOAT_DISTANCE;
            bonusText.style.opacity = 1 - currentValue;
        });
        animation.once('finish', () => {
            bonusTextPool.push(bonusText);
            bonusAnimationPool.push(animation);
        });
        animation.start(collisionEvent.timeStamp);
        bonusAnimations.push(animation);

    });

    coins.push(coin);
    world.insertBefore(character, coin);

};
