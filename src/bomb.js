import { COMMON_GRAVITY } from './common.js';

const BOMB_SIZE = 8;
const BOMB_SPEED = 5;
const BOMB_EDGES = 8;
const BOMB_VERTICES = COM.Vertices.createRegularPolygon(
    BOMB_EDGES,
    BOMB_SIZE,
);
const BOMB_COLOR = '#F90';

const bombPool = new HP.Pool({
    create: () => (
        new POM.BodyNode({
            category: 'bomb',
            classNames: ['bomb'],
            collisionFilter: POM.Category.for('platform'),
            sensorFilter: POM.Category.for('platform'),
            vertices: BOMB_VERTICES,
            gravity: COMMON_GRAVITY,
            style: {
                fillStyle: BOMB_COLOR,
            },
        })
    ),
    clear(bomb) {
        bomb.listenerMap.clear();
        if (bomb.parentNode) {
            bomb.parentNode.removeChild(bomb);
        }
    },
});

/**
 * @typedef {ReturnType<typeof bombPool['create']>} Bomb
 */

/**
 * @param {number} x
 * @param {number} y
 * @param {number} dx
 * @param {number} dy
 * @returns {Bomb}
 */
export const createBomb = (x, y, dx, dy) => {
    const bomb = bombPool.create();
    bomb.offset.set(x, y);
    bomb.velocity.set(dx, dy);
    bomb.velocity.norm = BOMB_SPEED;
    return bomb;
};

/**
 * @param {Bomb} bomb
 */
export const recycleBomb = (bomb) => {
    bombPool.push(bomb);
};
