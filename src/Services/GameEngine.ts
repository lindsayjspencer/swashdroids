import Bullet from 'ObjectLibrary/Bullet';
import CanvasObject from 'ObjectLibrary/CanvasObject';
import GameObject from 'ObjectLibrary/GameObject';
import Particle from 'ObjectLibrary/Particle';
import Spaceship from 'ObjectLibrary/Spaceship';
import * as THREE from 'three';
import ThreeEngine from './ThreeEngine';

export interface GameKeyState {
	ArrowUp: boolean;
	ArrowDown: boolean;
	ArrowLeft: boolean;
	ArrowRight: boolean;
	Space: boolean;
}

export default class GameEngine {
	sceneObjectArray: CanvasObject[] = [];
	spaceship?: Spaceship;
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

	constructor(threeEngine: ThreeEngine) {
		this.threeEngine = threeEngine;
	}

	initialise = () => {
		console.log('GameEngine initialised');

		const cubeSize = 0.3;
		const spaceshipSize = 0.5;

		const randomMapSize = 25;

		// create 15 randomly positioned cubes within a 100 x 100 xy grid
		for (let i = 0; i < 150; i++) {
			const cube = this.createCube(cubeSize);
			cube._object3d.position.x = Math.random() * randomMapSize - randomMapSize / 2;
			cube._object3d.position.y = Math.random() * randomMapSize - randomMapSize / 2;
			cube._object3d.position.z = 0;
			cube.setAnimationSpeed(Math.random() * 0.5 + 0.5);
			cube.setAnimationSpeeds({
				rotation: {
					x: 0.01,
					y: 0.01,
				},
			});
			this.addToScene(cube);
		}

		// create spaceship at 0,0
		const spaceship = new Spaceship(spaceshipSize);

		this.addToScene(spaceship);
		this.spaceship = spaceship;

		this.threeEngine.setOnAnimate(this.onAnimate);
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

	createCube = (size: number) => {
		const geometry = new THREE.BoxGeometry(size, size, size);
		const material = new THREE.MeshBasicMaterial({ color: 0xeaeaea });
		const object3d = new THREE.Mesh(geometry, material);
		return new CanvasObject(object3d);
	};

	addToScene = (object: CanvasObject) => {
		this.sceneObjectArray.push(object);
		this.threeEngine.addToScene(object._object3d);
	};

	removeFromScene = (object: CanvasObject) => {
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
			this.removeCanvasObjectIfRequired(bullet, this.bullets);
			bullet.beforeAnimate(frame);
		});
		this.particles.forEach((particle) => {
			this.removeCanvasObjectIfRequired(particle, this.particles);
			particle.beforeAnimate(frame);
		});

		// run animation function on all objects
		this.sceneObjectArray.forEach((object) => object.animate());

		// align camera with spaceship
		this.threeEngine.setCameraPosition(spaceship._object3d.position.x, spaceship._object3d.position.y);
	};

	removeCanvasObjectIfRequired = (object: CanvasObject, specificArray: CanvasObject[]) => {
		if (object.getShouldRemove()) {
			this.removeFromScene(object);
			specificArray.splice(specificArray.indexOf(object), 1);
		}
	};

	calculateSpaceshipProximity = (object: GameObject) => {
		const spaceship = this.getSpaceship();
		console.log('---');
		console.log('spaceshipY', spaceship._object3d.position.y);
		console.log('objectY', object._object3d.position.y);
		const distance = this.threeEngine.calculateDistanceBetweenObjects(object._object3d, spaceship._object3d);
		console.log('distance', distance);
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
