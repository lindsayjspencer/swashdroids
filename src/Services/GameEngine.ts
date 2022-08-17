import Asteroid from 'ObjectLibrary/Asteroid';
import Bullet from 'ObjectLibrary/Bullet';
import SceneObject from 'ObjectLibrary/SceneObject';
import GameObject from 'ObjectLibrary/GameObject';
import Particle from 'ObjectLibrary/Particle';
import Spaceship from 'ObjectLibrary/Spaceship';
import ThreeEngine from './ThreeEngine';

export interface GameKeyState {
	ArrowUp: boolean;
	ArrowDown: boolean;
	ArrowLeft: boolean;
	ArrowRight: boolean;
	Space: boolean;
}

export default class GameEngine {
	sceneObjectArray: SceneObject[] = [];
	spaceship?: Spaceship;
	asteroids: Asteroid[] = [];
	particles: Particle[] = [];
	bullets: Bullet[] = [];
	bulletAvailable = true;
	threeEngine: ThreeEngine;
	keyState: GameKeyState = {
		ArrowUp: false,
		ArrowDown: false,
		ArrowLeft: false,
		ArrowRight: false,
		Space: false,
	};
	totalAsteroidsTarget = 40;
	maxVisibleDistance: number;

	constructor(threeEngine: ThreeEngine) {
		this.threeEngine = threeEngine;
		const { height, width } = this.threeEngine.getVisibleHeightAndWidth();
		this.maxVisibleDistance = Math.sqrt(Math.pow(height, 2) + Math.pow(width, 2)) / 2;
	}

	recalculateVisibleDistance = () => {
		const { height, width } = this.threeEngine.getVisibleHeightAndWidth();
		this.maxVisibleDistance = Math.sqrt(Math.pow(height, 2) + Math.pow(width, 2)) / 2;
		console.log('maxVisibleDistnace', this.maxVisibleDistance);
		this.bullets.forEach((bullet) => {
			bullet.setMaxVisibleDistance(this.maxVisibleDistance);
		});
		this.asteroids.forEach((asteroid) => {
			asteroid.setMaxVisibleDistance(this.maxVisibleDistance);
		});
	};

	initialise = () => {
		console.log('GameEngine initialised');

		const spaceshipSize = 0.5;

		// create spaceship at 0,0
		const spaceship = new Spaceship(spaceshipSize);

		this.addToScene(spaceship);
		this.spaceship = spaceship;

		this.threeEngine.setOnAnimate(this.onAnimate);

		this.addAsteroids(this.totalAsteroidsTarget, 4, this.maxVisibleDistance + 5);
	};

	dispose = () => {
		console.log('GameEngine disposed');
		// clear objects from scene
		this.sceneObjectArray.forEach((object) => this.threeEngine.removeFromScene(object._object3d));
		this.sceneObjectArray = [];

		this.particles = [];
		this.bullets = [];

		this.spaceship = undefined;
		this.threeEngine.setOnAnimate(undefined);
	};

	addToScene = (object: SceneObject) => {
		this.sceneObjectArray.push(object);
		this.threeEngine.addToScene(object._object3d);
	};

	removeFromScene = (object: SceneObject) => {
		this.sceneObjectArray = this.sceneObjectArray.filter((sceneObject) => sceneObject !== object);
		this.threeEngine.removeFromScene(object._object3d);
	};

	getSpaceship = () => {
		if (this.spaceship) {
			return this.spaceship;
		}
		throw new Error('Spaceship not found');
	};

	onAnimate = (frame: number) => {
		const spaceship = this.getSpaceship();
		spaceship.beforeAnimate(frame, this.keyState);
		// exhaust particles
		if (this.keyState.ArrowUp && frame % 2 === 0) {
			const randomRotationAngle = -spaceship._object3d.rotation.z - Math.PI + Math.random() * 0.3 - 0.15;
			const particle = new Particle(
				0.03,
				{
					x: Math.sin(randomRotationAngle) / (Math.random() * 30 + 25),
					y: Math.cos(randomRotationAngle) / (Math.random() * 30 + 25),
				},
				{
					x:
						spaceship._object3d.position.x +
						(Math.random() * 0.08 - 0.04) +
						Math.sin(randomRotationAngle) / 8,
					y:
						spaceship._object3d.position.y +
						(Math.random() * 0.08 - 0.04) +
						Math.cos(randomRotationAngle) / 8,
				},
			);
			this.addToScene(particle);
			this.particles.push(particle);
		}
		this.bullets.forEach((bullet) => {
			this.calculateSpaceshipProximity(bullet);
			if (!this.removeSceneObjectIfRequired(bullet, this.bullets)) {
				bullet.beforeAnimate(frame);
			}
		});
		this.particles.forEach((particle) => {
			if (!this.removeSceneObjectIfRequired(particle, this.particles)) {
				particle.beforeAnimate(frame);
			}
		});
		this.asteroids.forEach((asteroid) => {
			this.calculateSpaceshipProximity(asteroid);
			if (!this.removeSceneObjectIfRequired(asteroid, this.asteroids)) {
				asteroid.beforeAnimate(frame);
			}
		});

		if (this.totalAsteroidsTarget > this.asteroids.length) {
			this.addAsteroids(
				this.totalAsteroidsTarget - this.asteroids.length,
				this.maxVisibleDistance + 6,
				this.maxVisibleDistance + 3,
			);
		}

		// run animation function on all objects
		this.sceneObjectArray.forEach((object) => object.animate());

		// align camera with spaceship
		this.threeEngine.setCameraPosition(spaceship._object3d.position.x, spaceship._object3d.position.y);
	};

	addAsteroids = (amount: number, minDistance: number, maxDistance: number) => {
		const spaceship = this.getSpaceship();

		for (let i = 0; i < amount; i++) {
			const randomAngle = Math.random() * Math.PI * 2;
			const randomDistance = Math.random() * (maxDistance - minDistance) + minDistance;
			const asteroid = new Asteroid(
				1,
				8,
				{
					x: Math.random() * 0.01 - 0.005,
					y: Math.random() * 0.01 - 0.005,
				},
				{
					x: spaceship._object3d.position.x + Math.sin(randomAngle) * randomDistance,
					y: spaceship._object3d.position.y + Math.cos(randomAngle) * randomDistance,
				},
				this.maxVisibleDistance,
			);
			this.addToScene(asteroid);
			this.asteroids.push(asteroid);
		}
	};

	removeSceneObjectIfRequired = (object: SceneObject, specificArray: SceneObject[]) => {
		if (object.getShouldRemove()) {
			this.removeFromScene(object);
			specificArray.splice(specificArray.indexOf(object), 1);
			object.dispose();
			return true;
		}
		return false;
	};

	calculateSpaceshipProximity = (object: GameObject) => {
		const spaceship = this.getSpaceship();
		const distance = this.threeEngine.calculateDistanceBetweenObjects(object._object3d, spaceship._object3d);
		const angle = this.threeEngine.calculateAngleBetweenObjects(object._object3d, spaceship._object3d);
		object.setAngleToSpaceship(angle);
		object.setDistanceToSpaceship(distance);
	};

	fireBullet = () => {
		if (!this.bulletAvailable) return;
		const spaceship = this.getSpaceship();
		this.bulletAvailable = false;
		const rotationAngle = -spaceship._object3d.rotation.z;
		const bullet = new Bullet(
			0.03,
			{
				x: Math.sin(rotationAngle) / 6,
				y: Math.cos(rotationAngle) / 6,
			},
			{
				x: spaceship._object3d.position.x + Math.sin(rotationAngle) / 10,
				y: spaceship._object3d.position.y + Math.cos(rotationAngle) / 10,
			},
			this.maxVisibleDistance,
		);
		this.addToScene(bullet);
		this.bullets.push(bullet);
	};

	onKeyDown = (event: KeyboardEvent) => {
		switch (event.code) {
			case 'ArrowUp':
				this.keyState['ArrowUp'] = true;
				// move spaceship forward
				break;
			case 'ArrowDown':
				this.keyState['ArrowDown'] = true;
				// move spaceship backward
				break;
			case 'ArrowLeft':
				this.keyState['ArrowLeft'] = true;
				// rotate spaceship left
				break;
			case 'ArrowRight':
				this.keyState['ArrowRight'] = true;
				// rotate spaceship right
				break;
			case 'Space':
				this.keyState['Space'] = true;
				this.fireBullet();
				// fire
				break;
		}
	};

	onKeyUp = (event: KeyboardEvent) => {
		switch (event.code) {
			case 'ArrowUp':
				this.keyState['ArrowUp'] = false;
				// stop moving spaceship forward
				break;
			case 'ArrowDown':
				this.keyState['ArrowDown'] = false;
				// stop moving spaceship backward
				break;
			case 'ArrowLeft':
				this.keyState['ArrowLeft'] = false;
				// stop rotating spaceship left
				break;
			case 'ArrowRight':
				this.keyState['ArrowRight'] = false;
				// stop rotating spaceship right
				break;
			case 'Space':
				this.keyState['Space'] = false;
				this.bulletAvailable = true;
				// stop firing
				break;
		}
	};
}
