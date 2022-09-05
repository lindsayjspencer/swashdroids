import Asteroid, { AsteroidSize } from 'ObjectLibrary/Asteroid';
import Bullet from 'ObjectLibrary/Bullet';
import SceneObject from 'ObjectLibrary/SceneObject';
import GameObject from 'ObjectLibrary/GameObject';
import Particle from 'ObjectLibrary/Particle';
import Spaceship from 'ObjectLibrary/Spaceship';
import ThreeEngine from './ThreeEngine';
import { ColorRepresentation } from 'three';
import Enemy from 'ObjectLibrary/Enemy';
import AsteroidFragment from 'ObjectLibrary/AsteroidFragment';
import LightEnemyA from 'ObjectLibrary/LightEnemyA';
import LightEnemyB from 'ObjectLibrary/LightEnemyB';

export interface GameKeyState {
	ArrowUp: boolean;
	ArrowDown: boolean;
	ArrowLeft: boolean;
	ArrowRight: boolean;
	Space: boolean;
}

export enum GameObjectType {
	Asteroid,
	FadingArtifact,
	Enemy,
	SpaceshipBullet,
	EnemyBullet,
}

export interface GameObjectsMap {
	[GameObjectType.Asteroid]: Asteroid[];
	[GameObjectType.FadingArtifact]: AsteroidFragment[];
	[GameObjectType.Enemy]: Enemy[];
	[GameObjectType.SpaceshipBullet]: Bullet[];
	[GameObjectType.EnemyBullet]: Bullet[];
}

const createBlankGameObjectMap = () =>
	({
		[GameObjectType.Asteroid]: [],
		[GameObjectType.FadingArtifact]: [],
		[GameObjectType.Enemy]: [],
		[GameObjectType.SpaceshipBullet]: [],
		[GameObjectType.EnemyBullet]: [],
	} as GameObjectsMap);

export default class GameEngine {
	sceneObjectArray: SceneObject[] = [];
	spaceship?: Spaceship;
	gameObjects = createBlankGameObjectMap();
	gameObjectsToAdd = createBlankGameObjectMap();
	gameObjectsToRemove = createBlankGameObjectMap();
	bulletAvailable = true;
	threeEngine: ThreeEngine;
	keyState: GameKeyState = {
		ArrowUp: false,
		ArrowDown: false,
		ArrowLeft: false,
		ArrowRight: false,
		Space: false,
	};
	totalAsteroidsTarget = 0;
	asteroidDenity = 20;
	totalEnemiesTarget = 3;
	maxVisibleDistance = 0;

	constructor(threeEngine: ThreeEngine) {
		this.threeEngine = threeEngine;
		this.recalculateVisibleDistance();
	}

	setMaxVisibleDistance = (distance: number) => {
		this.maxVisibleDistance = distance;
		this.totalAsteroidsTarget = Math.floor(this.asteroidDenity * distance);
		this.spaceship?.setMaxVisibleDistance(distance);
		this.gameObjects[GameObjectType.SpaceshipBullet].forEach((bullet) => {
			bullet.setMaxVisibleDistance(distance);
		});
		this.gameObjects[GameObjectType.EnemyBullet].forEach((bullet) => {
			bullet.setMaxVisibleDistance(distance);
		});
		this.gameObjects[GameObjectType.Asteroid].forEach((asteroid) => {
			asteroid.setMaxVisibleDistance(distance);
		});
		this.gameObjects[GameObjectType.Enemy].forEach((enemy) => {
			enemy.setMaxVisibleDistance(distance);
		});
	};

	recalculateVisibleDistance = () => {
		const { height, width } = this.threeEngine.getVisibleHeightAndWidth();
		this.setMaxVisibleDistance(Math.sqrt(Math.pow(height, 2) + Math.pow(width, 2)) / 2);
	};

	initialise = () => {
		console.log('GameEngine initialised');

		this.recalculateVisibleDistance();

		const spaceshipSize = 0.5;

		const spaceship = new Spaceship({
			size: spaceshipSize,
			getGameObjectsToAdd: () => this.gameObjectsToAdd,
			addExplosion: this.addExplosion,
			maxVisibleDistance: this.maxVisibleDistance,
		});

		this.addToScene([spaceship]);
		this.spaceship = spaceship;

		this.threeEngine.setOnAnimate(this.onAnimate);

		this.addRandomAsteroids(this.totalAsteroidsTarget, 4, this.maxVisibleDistance + 5);
	};

	dispose = () => {
		console.log('GameEngine disposed');
		// clear objects from scene
		this.threeEngine.removeFromScene(this.sceneObjectArray.map((object) => object._object3d));
		this.sceneObjectArray = [];

		this.gameObjects = createBlankGameObjectMap();

		this.gameObjectsToAdd = createBlankGameObjectMap();
		this.gameObjectsToRemove = createBlankGameObjectMap();

		this.spaceship = undefined;
		this.threeEngine.setOnAnimate(undefined);
	};

	addToScene = (objects: SceneObject[]) => {
		this.sceneObjectArray = this.sceneObjectArray.concat(objects);
		this.threeEngine.addToScene(objects.map((object) => object._object3d));
	};

	removeFromScene = (objects: SceneObject[]) => {
		this.sceneObjectArray = this.sceneObjectArray.filter((sceneObject) => !objects.includes(sceneObject));
		this.threeEngine.removeFromScene(objects.map((object) => object._object3d));
	};

	getSpaceship = () => {
		if (this.spaceship) {
			return this.spaceship;
		}
		throw new Error('Spaceship not found');
	};

	onAnimate = (frame: number) => {
		this.addObjectsToScene();
		const spaceship = this.getSpaceship();
		spaceship.beforeAnimate(frame, this.keyState);
		[...this.gameObjects[GameObjectType.SpaceshipBullet], ...this.gameObjects[GameObjectType.EnemyBullet]].forEach(
			(bullet) => {
				// check asteroids for collision
				if (frame % 2 === 0) {
					for (const asteroid of this.gameObjects[GameObjectType.Asteroid]) {
						const distance = this.threeEngine.calculateDistanceBetweenObjects(
							bullet._object3d,
							asteroid._object3d,
						);
						if (asteroid.checkForBulletCollision(bullet, distance)) {
							break;
						}
					}
					// update spaceship proximity
					this.calculateSpaceshipProximity(bullet);
				}
			},
		);
		this.gameObjects[GameObjectType.SpaceshipBullet].forEach((bullet) => {
			// check enemies for collision
			if (frame % 2 === 0 && !bullet.getShouldRemove()) {
				for (const enemy of this.gameObjects[GameObjectType.Enemy]) {
					const distance = this.threeEngine.calculateDistanceBetweenObjects(
						bullet._object3d,
						enemy._object3d,
					);
					if (enemy.checkForBulletCollision(bullet, distance)) {
						break;
					}
				}
			}
			if (!bullet.getShouldRemove()) {
				bullet.beforeAnimate(frame);
			}
		});
		this.gameObjects[GameObjectType.EnemyBullet].forEach((bullet) => {
			// check spaceship for collision
			if (frame % 2 === 0 && !bullet.getShouldRemove()) {
				spaceship.checkCollisionWithBullet(bullet);
			}
			if (!bullet.getShouldRemove()) {
				bullet.beforeAnimate(frame);
			}
		});
		this.gameObjects[GameObjectType.FadingArtifact].forEach((artifact) => {
			if (!artifact.getShouldRemove()) {
				artifact.beforeAnimate(frame);
			}
		});
		this.gameObjects[GameObjectType.Asteroid].forEach((asteroid) => {
			if ((frame + 1) % 3 === 0) {
				// update spaceship proximity
				this.calculateSpaceshipProximity(asteroid);
				if (!spaceship.isInvincible) {
					asteroid.checkForSpaceshipCollision(spaceship);
				}
			}
			if (!asteroid.getShouldRemove()) {
				asteroid.beforeAnimate(frame);
			}
		});
		this.gameObjects[GameObjectType.Enemy].forEach((enemy) => {
			if ((frame + 2) % 3 === 0) {
				// update spaceship proximity
				this.calculateSpaceshipProximity(enemy);
				if (!spaceship.isInvincible) {
					enemy.checkForSpaceshipCollision(spaceship);
				}
			}
			if (!enemy.getShouldRemove()) {
				enemy.beforeAnimate(frame);
			}
		});

		this.removeObjectsFromScene();

		if (this.totalAsteroidsTarget > this.gameObjects[GameObjectType.Asteroid].length) {
			this.addRandomAsteroids(
				this.totalAsteroidsTarget - this.gameObjects[GameObjectType.Asteroid].length,
				this.maxVisibleDistance + 6,
				this.maxVisibleDistance + 3,
			);
		}

		if (this.totalEnemiesTarget > this.gameObjects[GameObjectType.Enemy].length) {
			this.addRandomLightEnemies(
				this.totalEnemiesTarget - this.gameObjects[GameObjectType.Enemy].length,
				this.maxVisibleDistance + 6,
				this.maxVisibleDistance + 3,
			);
		}

		console.log('particles', this.gameObjects[GameObjectType.FadingArtifact].length);

		// run animation function on all objects
		this.sceneObjectArray.forEach((object) => object.animate());

		// align camera with spaceship
		this.threeEngine.setCameraPosition(spaceship._object3d.position.x, spaceship._object3d.position.y);
	};

	removeObjectsFromScene = () => {
		const objectsToRemove = this.sceneObjectArray.filter((object) => object.getShouldRemove());

		if (objectsToRemove.length > 0) {
			this.removeFromScene(objectsToRemove);
			objectsToRemove.forEach((object) => object.dispose());
			this.gameObjects[GameObjectType.SpaceshipBullet] = this.gameObjects[GameObjectType.SpaceshipBullet].filter(
				(bullet) => !bullet.getShouldRemove(),
			);

			this.gameObjects[GameObjectType.EnemyBullet] = this.gameObjects[GameObjectType.EnemyBullet].filter(
				(bullet) => !bullet.getShouldRemove(),
			);

			this.gameObjects[GameObjectType.Asteroid] = this.gameObjects[GameObjectType.Asteroid].filter(
				(asteroid) => !asteroid.getShouldRemove(),
			);

			this.gameObjects[GameObjectType.FadingArtifact] = this.gameObjects[GameObjectType.FadingArtifact].filter(
				(artifact) => !artifact.getShouldRemove(),
			);

			this.gameObjects[GameObjectType.Enemy] = this.gameObjects[GameObjectType.Enemy].filter(
				(enemy) => !enemy.getShouldRemove(),
			);
		}
	};

	addObjectsToScene = () => {
		const objectsToAdd: SceneObject[] = [];
		this.gameObjectsToAdd[GameObjectType.SpaceshipBullet].forEach((bullet) => {
			this.gameObjects[GameObjectType.SpaceshipBullet].push(bullet);
			objectsToAdd.push(bullet);
		});
		this.gameObjectsToAdd[GameObjectType.EnemyBullet].forEach((bullet) => {
			this.gameObjects[GameObjectType.EnemyBullet].push(bullet);
			objectsToAdd.push(bullet);
		});
		this.gameObjectsToAdd[GameObjectType.FadingArtifact].forEach((asteroidFragment) => {
			this.gameObjects[GameObjectType.FadingArtifact].push(asteroidFragment);
			objectsToAdd.push(asteroidFragment);
		});
		this.gameObjectsToAdd[GameObjectType.Enemy].forEach((enemy) => {
			this.gameObjects[GameObjectType.Enemy].push(enemy);
			objectsToAdd.push(enemy);
		});
		this.gameObjectsToAdd[GameObjectType.Asteroid].forEach((asteroid) => {
			this.gameObjects[GameObjectType.Asteroid].push(asteroid);
			objectsToAdd.push(asteroid);
		});

		if (objectsToAdd.length === 0) return;
		this.addToScene(objectsToAdd);

		this.gameObjectsToAdd = createBlankGameObjectMap();
	};

	addAsteroidFragment = (asteroidFragment: AsteroidFragment) => {
		this.gameObjectsToAdd[GameObjectType.FadingArtifact].push(asteroidFragment);
	};

	addAsteroid = (asteroid: Asteroid) => {
		this.gameObjectsToAdd[GameObjectType.Asteroid].push(asteroid);
	};

	addRandomAsteroids = (amount: number, minDistance: number, maxDistance: number) => {
		const spaceship = this.getSpaceship();

		for (let i = 0; i < amount; i++) {
			const randomAngle = Math.random() * Math.PI * 2;
			const randomDistance = Math.random() * (maxDistance - minDistance) + minDistance;
			const randomAsteroidSize = Math.random() > 0.5 ? AsteroidSize.LARGE : AsteroidSize.SMALL;
			this.addAsteroid(
				new Asteroid(
					{
						size: randomAsteroidSize,
						startingPosition: {
							x: spaceship._object3d.position.x + Math.sin(randomAngle) * randomDistance,
							y: spaceship._object3d.position.y + Math.cos(randomAngle) * randomDistance,
						},
					},
					this.maxVisibleDistance,
					this.addAsteroid,
					this.addAsteroidFragment,
					this.addExplosion,
				),
			);
		}
	};

	addRandomLightEnemies = (amount: number, minDistance: number, maxDistance: number) => {
		const spaceship = this.getSpaceship();

		for (let i = 0; i < amount; i++) {
			const randomAngle = Math.random() * Math.PI * 2;
			const randomDistance = Math.random() * (maxDistance - minDistance) + minDistance;
			const enemy =
				Math.random() > 0.5
					? new LightEnemyA(
							{
								startingPosition: {
									x: spaceship._object3d.position.x + Math.sin(randomAngle) * randomDistance,
									y: spaceship._object3d.position.y + Math.cos(randomAngle) * randomDistance,
								},
								getGameObjectsToAdd: () => this.gameObjectsToAdd,
								addExplosion: this.addExplosion,
							},
							1,
							this.maxVisibleDistance,
					  )
					: new LightEnemyB(
							{
								startingPosition: {
									x: spaceship._object3d.position.x + Math.sin(randomAngle) * randomDistance,
									y: spaceship._object3d.position.y + Math.cos(randomAngle) * randomDistance,
								},
								getGameObjectsToAdd: () => this.gameObjectsToAdd,
								addExplosion: this.addExplosion,
							},
							1,
							this.maxVisibleDistance,
					  );
			this.gameObjectsToAdd[GameObjectType.Enemy].push(enemy);
		}
	};

	calculateSpaceshipProximity = (object: GameObject) => {
		const spaceship = this.getSpaceship();
		const distance = this.threeEngine.calculateDistanceBetweenObjects(object._object3d, spaceship._object3d);
		const angle = this.threeEngine.calculateAngleBetweenObjects(object._object3d, spaceship._object3d);
		object.setAngleToSpaceship(angle);
		object.setDistanceToSpaceship(distance);
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
				this.getSpaceship().fireBullet();
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
				this.getSpaceship().bulletAvailable = true;
				// stop firing
				break;
		}
	};

	particleExplosion = (options: {
		amount: NumberOrFunction;
		colour: ColorRepresentation;
		size: NumberOrFunction;
		xySpeed: NumberOrFunction;
		zSpeed: NumberOrFunction;
		minZSpeed: NumberOrFunction;
		position: Required<ParticleExplosionPosition>;
		lifetime: NumberOrFunction;
		opacity: NumberOrFunction;
		angle: NumberOrFunction;
	}) => {
		const { amount, colour, size, xySpeed, zSpeed, minZSpeed, position, lifetime, opacity, angle } = options;
		const particlesToAdd: Particle[] = [];
		for (let i = 0; i < amount; i++) {
			const _xySpeed = returnNumber(xySpeed);
			const _zSpeed = returnNumber(zSpeed);
			const _minZSpeed = returnNumber(minZSpeed);
			const xOffset = returnNumber(position.xOffset);
			const yOffset = returnNumber(position.yOffset);
			const spread = returnNumber(position.spread);
			const _angle = returnNumber(angle);
			const xSpeed = (Math.sin(_angle) * _xySpeed) / Math.max(_minZSpeed, _zSpeed);
			const ySpeed = (Math.cos(_angle) * _xySpeed) / Math.max(_minZSpeed, _zSpeed);
			const particle = new Particle({
				color: colour,
				size: returnNumber(size),
				speed: {
					x: xSpeed,
					y: ySpeed,
					z: _zSpeed,
				},
				startingPosition: {
					x: returnNumber(position.x) + xOffset + spread * xSpeed,
					y: returnNumber(position.y) + yOffset + spread * ySpeed,
				},
				opacity: returnNumber(opacity),
				lifetime: returnNumber(lifetime),
			});
			particlesToAdd.push(particle);
		}
		return particlesToAdd;
	};

	addExplosion: IAddExplosion = (impact, blowback, explosion) => {
		// Impact particles
		const impactParticles = this.particleExplosion({
			amount: impact.particles?.amount ?? 3,
			colour: impact.particles?.colour ?? 0xf5aa42,
			size: impact.particles?.size ?? 0.03,
			xySpeed: impact.particles?.xySpeed ?? (() => Math.random() * 0.07 + 0.02),
			zSpeed: impact.particles?.zSpeed ?? (() => Math.random() * 1.5 - 0.75),
			minZSpeed: impact.particles?.minZSpeed ?? 1,
			lifetime: impact.particles?.lifetime ?? (() => Math.random() * 0.5 + 0.2),
			opacity: impact.particles?.opacity ?? (() => Math.random()),
			position: {
				x: impact.position.x,
				y: impact.position.y,
				xOffset: impact.position.xOffset ?? (() => Math.random() * 0.08 - 0.04),
				yOffset: impact.position.yOffset ?? (() => Math.random() * 0.08 - 0.04),
				spread: impact.particles?.spread ?? Math.random() * 0.08 - 0.04,
			},
			angle: impact.angle ?? (() => Math.random() * Math.PI * 2),
		});
		this.gameObjectsToAdd[GameObjectType.FadingArtifact].push(...impactParticles);
		// Blowback particles
		const blowbackParticles = this.particleExplosion({
			amount: blowback.particles?.amount ?? 12,
			colour: blowback.particles?.colour ?? 0xf5aa42,
			size: blowback.particles?.size ?? 0.03,
			xySpeed: blowback.particles?.xySpeed ?? (() => Math.random() * 0.04 + 0.02),
			zSpeed: blowback.particles?.zSpeed ?? (() => Math.random() * 1.5 - 0.75),
			minZSpeed: blowback.particles?.minZSpeed ?? 1,
			lifetime: blowback.particles?.lifetime ?? (() => Math.random() * 0.5),
			opacity: blowback.particles?.opacity ?? (() => Math.random()),
			position: {
				x: blowback.position.x,
				y: blowback.position.y,
				xOffset: blowback.position.xOffset ?? (() => Math.random() * 0.08 - 0.04),
				yOffset: blowback.position.yOffset ?? (() => Math.random() * 0.08 - 0.04),
				spread: blowback.particles?.spread ?? Math.random() * 0.08 - 0.04,
			},
			angle: blowback.angle ?? (() => Math.random() * Math.PI * 2),
		});
		this.gameObjectsToAdd[GameObjectType.FadingArtifact].push(...blowbackParticles);
		// Explosion particles
		const explosionParticles = this.particleExplosion({
			amount: explosion.particles?.amount ?? 12,
			colour: explosion.particles?.colour ?? 0x000000,
			size: explosion.particles?.size ?? 0.02,
			xySpeed: explosion.particles?.xySpeed ?? (() => Math.random() * 0.01 + 0.01),
			zSpeed: explosion.particles?.zSpeed ?? (() => Math.random() * 1.5),
			minZSpeed: explosion.particles?.minZSpeed ?? 0.5,
			lifetime: explosion.particles?.lifetime ?? (() => Math.random() * 0.5),
			opacity: explosion.particles?.opacity ?? (() => Math.random()),
			position: {
				x: explosion.position.x,
				y: explosion.position.y,
				xOffset: explosion.position.xOffset ?? (() => Math.random() * 0.08 - 0.04),
				yOffset: explosion.position.yOffset ?? (() => Math.random() * 0.08 - 0.04),
				spread: explosion.particles?.spread ?? (() => Math.random() * 0.03 + 0.03),
			},
			angle: explosion.angle ?? (() => Math.random() * Math.PI * 2),
		});
		this.gameObjectsToAdd[GameObjectType.FadingArtifact].push(...explosionParticles);
	};
}

export type IAddExplosion = (
	impact: IParticleExplosion,
	blowback: IParticleExplosion,
	explosion: IParticleExplosion,
) => void;

export type IParticleExplosion = {
	angle?: NumberOrFunction;
	position: ParticleExplosionPosition;
	particles?: ParticleExplosionOptions;
};

export type ParticleExplosionPosition = {
	x: NumberOrFunction;
	y: NumberOrFunction;
	xOffset?: NumberOrFunction;
	yOffset?: NumberOrFunction;
	spread?: NumberOrFunction;
};

export type ParticleExplosionOptions = {
	colour?: ColorRepresentation;
	amount?: NumberOrFunction;
	size?: NumberOrFunction;
	opacity?: NumberOrFunction;
	lifetime?: NumberOrFunction;
	xySpeed?: NumberOrFunction;
	zSpeed?: NumberOrFunction;
	minZSpeed?: NumberOrFunction;
	offset?: NumberOrFunction;
	spread?: NumberOrFunction;
};

export type NumberOrFunction = number | (() => number);

export const returnNumber = (value: NumberOrFunction) => {
	if (typeof value === 'number') {
		return value;
	}
	return value();
};
