import { engine, COMMON_ELASTICITY, COMMON_FRICTION, COMMON_GRAVITY, COMMON_STATIC_FRICTION } from './common.js';

export const CHARACTER_SIZE = 40;
export const CHARACTER_INIT_X = engine.width / 2;

export const character = new POM.BodyNode({
    category: 'character',
    classNames: ['character'],
    gravity: COMMON_GRAVITY,
    friction: COMMON_FRICTION,
    staticFriction: COMMON_STATIC_FRICTION,
    elasticity: COMMON_ELASTICITY,
    vertices: COM.Vertices.createRectangle(
        CHARACTER_SIZE,
        CHARACTER_SIZE,
    ),
    style: {
        fillStyle: '#39F',
        lineWidth: 2,
    },
});
