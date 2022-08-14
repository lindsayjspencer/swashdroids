import Bullet from 'ObjectLibrary/Bullet';
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
	sceneObjectArray: GameObject[] = [];
	spaceShip?: Spaceship;
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
		spaceship._object3d.position.x = 0;
		spaceship._object3d.position.y = 0;
		spaceship._object3d.position.z = 0;
		spaceship.setAnimationSpeed(0.5);

		this.addToScene(spaceship);
		this.spaceShip = spaceship;

		this.threeEngine.setOnAnimate(this.onAnimate);
	};

	dispose = () => {
		console.log('GameEngine disposed');
		// clear objects from scene
		this.sceneObjectArray.forEach((object) => this.threeEngine.removeFromScene(object._object3d));
		this.sceneObjectArray = [];
	};

	createCube = (size: number) => {
		const geometry = new THREE.BoxGeometry(size, size, size);
		const material = new THREE.MeshBasicMaterial({ color: 0xeaeaea });
		const object3d = new THREE.Mesh(geometry, material);
		return new GameObject(object3d);
	};

	addToScene = (object: GameObject) => {
		this.sceneObjectArray.push(object);
		this.threeEngine.addToScene(object._object3d);
	};

	onAnimate = (frame: number) => {
		if (!this.spaceShip) return;
		this.spaceShip.beforeAnimate(frame, this.keyState);
		console.log(this.threeEngine.camera.position.x === this.spaceShip._object3d.position.x);
		// exhaust particles
		if (this.keyState.ArrowUp && frame % 2 === 0) {
			const randomRotationAngle = -this.spaceShip._object3d.rotation.z - Math.PI + Math.random() * 0.3 - 0.15;
			const particle = new Particle(
				0.03,
				{
					x: Math.sin(randomRotationAngle) / (Math.random() * 30 + 25),
					y: Math.cos(randomRotationAngle) / (Math.random() * 30 + 25),
				},
				{
					x:
						this.spaceShip._object3d.position.x +
						(Math.random() * 0.08 - 0.04) +
						Math.sin(randomRotationAngle) / 8,
					y:
						this.spaceShip._object3d.position.y +
						(Math.random() * 0.08 - 0.04) +
						Math.cos(randomRotationAngle) / 8,
				},
				() => {
					this.threeEngine.removeFromScene(particle._object3d);
					this.particles.splice(this.particles.indexOf(particle), 1);
				},
			);
			this.addToScene(particle);
			this.particles.push(particle);
		}
		this.bullets.forEach((bullet) => {
			if (!this.spaceShip) return;
			bullet.beforeAnimate(frame, this.spaceShip._object3d.position);
		});
		this.particles.forEach((particle) => particle.beforeAnimate(frame));
		this.sceneObjectArray.forEach((object) => object.animate(frame));

		this.threeEngine.setCameraPosition(this.spaceShip._object3d.position.x, this.spaceShip._object3d.position.y);
	};

	fireBullet = () => {
		if (!this.bulletAvailable || !this.spaceShip) return;
		this.bulletAvailable = false;
		const rotationAngle = -this.spaceShip._object3d.rotation.z;
		const bullet = new Bullet(
			0.03,
			{
				x: Math.sin(rotationAngle) / 6,
				y: Math.cos(rotationAngle) / 6,
			},
			{
				x: this.spaceShip._object3d.position.x + Math.sin(rotationAngle) / 10,
				y: this.spaceShip._object3d.position.y + Math.cos(rotationAngle) / 10,
			},
			() => {
				this.threeEngine.removeFromScene(bullet._object3d);
				this.bullets.splice(this.bullets.indexOf(bullet), 1);
			},
		);
		bullet.setAnimationSpeeds({
			rotation: {
				x: 0.01,
				y: 0.01,
			},
		});
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
