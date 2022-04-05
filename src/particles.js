import { createRandomizer } from './common.js';

const PARTICLE_GROUP_SIZE = 20;
const PARTICLE_PREPARE_COUNT = 100;
const PARTICLE_SIZE = 10;
const PARTICLE_LIFE = 2000;
const PARTICLE_MIN_SPEED = 0.1;
const PARTICLE_MAX_SPEED = 0.5;
const PARTICLE_VERTICES = COM.Vertices.createRectangle(
    PARTICLE_SIZE,
    PARTICLE_SIZE,
);
const PARTICLE_COLORS = [
    '#F00',
    '#FF0',
    '#0F0',
    '#0FF',
    '#00F',
    '#F0F',
];

const particleColorRandomizer = createRandomizer();
const particleSpeedRandomizer = createRandomizer();

/**
 * @type {COM.Vector[]}
 */
const PARTICLE_DIRECTIONS = [];

// init PARTICLE_DIRECTIONS
const PARTICLE_DELTA_ANGLE = COM.Utils.Constants.TWO_PI / PARTICLE_GROUP_SIZE;
for (let i = 0; i < PARTICLE_GROUP_SIZE; i++) {
    PARTICLE_DIRECTIONS.push(
        (new COM.Vector(1, 0))
            .rotate(PARTICLE_DELTA_ANGLE * i)
    );
}

const particlePool = new HP.Pool({
    initSize: PARTICLE_PREPARE_COUNT,
    create: () => (
        new POM.BodyNode({
            classNames: ['particle'],
            vertices: PARTICLE_VERTICES,
            airFriction: 0.01,
            style: {
                fillStyle: particleColorRandomizer.choice(PARTICLE_COLORS),
            },
        })
    ),
});

const animationPool = new HP.Pool({
    initSize: PARTICLE_PREPARE_COUNT,
    create: () => (
        new COM.Animation({
            from: 1,
            to: 0,
            duration: PARTICLE_LIFE,
            timing: COM.Timing.easeOut,
        })
    ),
});

/**
 * @typedef {ReturnType<(typeof particlePool)['create']>} Particle
 */

/**
 * @typedef ParticleGroup
 * @property {Particle[]} particles
 * @property {COM.Animation} animation
 */

/**
 * @param {number} x
 * @param {number} y
 */
const createParticles = (x, y) => {
    const particles = [];
    for (let i = 0; i < PARTICLE_GROUP_SIZE; i++) {
        const particle = particlePool.pop();
        particle.offset.set(x, y);
        particle.velocity.setVector(PARTICLE_DIRECTIONS[i])
            .scale(
                particleSpeedRandomizer.float(
                    PARTICLE_MIN_SPEED,
                    PARTICLE_MAX_SPEED,
                )
            );
        particles.push(particle);
    }
    return particles;
};

/**
 * @param {ParticleGroup} group
 */
const recycleParticleGroup = (group) => {

    group.particles.forEach(particle => {
        if (particle.parentNode) {
            particle.parentNode.removeChild(particle);
        }
        particlePool.push(particle);
    });

    animationPool.push(group.animation);

};

/**
 * @param {number} x
 * @param {number} y
 * @param {number} timeStamp
 * @returns {ParticleGroup}
 */
export const createParticleGroup = (x, y, timeStamp) => {

    const particles = createParticles(x, y);

    const animation = animationPool.pop();
    animation.on('update', event => {
        particles.forEach(particle => {
            particle.style.opacity = event.data.currentValue;
        });
    });
    animation.start(timeStamp);
    animation.once('finish', event => {
        recycleParticleGroup(particleGroup);
    });

    const particleGroup = {
        particles,
        animation,
    };

    return particleGroup;

};
