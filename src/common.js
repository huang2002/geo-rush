export const SIMPLE_BUTTON_WIDTH = 120;
export const SIMPLE_BUTTON_HEIGHT = 50;

export const FRAME_DURATION = 5;
export const MAX_FRAME_COUNT = 5;

export const COMMON_GRAVITY = new COM.Vector(0, 0.02);
export const COMMON_FRICTION = 0.7;
export const COMMON_STATIC_FRICTION = 0.71;
export const COMMON_ELASTICITY = 0.4;

const ENGINE_WIDTH = 320;
const ENGINE_HEIGHT = 640;

export const engine = new HE.CanvasEngine({
    interactive: true,
    style: {
        fillStyle: '#223',
        font: '18px sans-serif',
    },
    resizerOptions: {
        container: document.body,
        width: ENGINE_WIDTH,
        height: ENGINE_HEIGHT,
        padding: 10,
    },
    renderer: new COM.Renderer({
        width: ENGINE_WIDTH,
        height: ENGINE_HEIGHT,
        ratio: (
            COM.Utils.Constants.SUPPORTS_TOUCH_EVENTS
                ? window.devicePixelRatio
                : 2
        ),
    }),
});

/**
 * @param {string} content
 * @param {string} [color]
 */
export const SimpleText = (content, color = '#FFF') => (
    COM.create(COM.TextNode, {
        stretch: 1,
        content,
        style: {
            textAlign: 'center',
            textBaseline: 'middle',
            fillStyle: color,
        },
    })
);

/**
 * @param {string} content
 * @param {COM.EventListener<COM.CanvasClickEvent>} callback
 */
export const SimpleButton = (content, callback) => (
    COM.create(COM.RectNode, {
        interactive: true,
        width: SIMPLE_BUTTON_WIDTH,
        height: SIMPLE_BUTTON_HEIGHT,
        radius: 5,
        listeners: {
            click: callback,
        },
        style: {
            fillStyle: 'rgba(255, 255, 255, 0.1)',
            strokeStyle: '#DDD',
        },
    }, [
        SimpleText(content),
    ])
);

let randomizerCount = 0;

export const createRandomizer = () => (
    new HRandom.Randomizer({
        seed: Date.now() + (randomizerCount++),
    })
);
