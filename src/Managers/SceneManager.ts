import Asteroid, { AsteroidSize } from 'ObjectLibrary/Asteroid';
import Bullet from 'ObjectLibrary/Bullet';
import SceneObject from 'ObjectLibrary/SceneObject';
import Spaceship from 'ObjectLibrary/Spaceship';
import ThreeEngine from '../Engines/ThreeEngine';
import Enemy from 'ObjectLibrary/Enemy';
import AsteroidFragment from 'ObjectLibrary/AsteroidFragment';
import LightEnemyA from 'ObjectLibrary/LightEnemyA';
import LightEnemyB from 'ObjectLibrary/LightEnemyB';
import FadingArtifact from 'ObjectLibrary/FadingArtifact';
import ExplosionEngine from '../Engines/ExplosionEngine';

export enum GameObjectType {
	Asteroid,
	FadingArtifact,
	Enemy,
	SpaceshipBullet,
	EnemyBullet,
}

export interface GameObjectsMap {
	[GameObjectType.Asteroid]: Asteroid[];
	[GameObjectType.FadingArtifact]: FadingArtifact[];
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

export default class SceneManager {
	// 3D objects
	sceneObjectArray: SceneObject[] = [];
	spaceship?: Spaceship;
	gameObjects = createBlankGameObjectMap();
	gameObjectsToAdd = createBlankGameObjectMap();

	// Three JS related
	threeEngine: ThreeEngine;
	maxVisibleDistance = 0;

	// Asteroids
	totalAsteroidsTarget = 0;
	asteroidDenity = 20;

	// Enemies
	totalEnemiesTarget = 3;

	// Other engines
	explosionEngine: ExplosionEngine;

	constructor(threeEngine: ThreeEngine) {
		this.threeEngine = threeEngine;
		this.explosionEngine = new ExplosionEngine(this.addFadingArtifacts);
	}

	setMaxVisibleDistance = (distance: number) => {
		this.maxVisibleDistance = distance;
		this.totalAsteroidsTarget = Math.floor(this.asteroidDenity * distance);
		this.spaceship?.setMaxVisibleDistance(distance);
		[
			...this.gameObjects[GameObjectType.SpaceshipBullet],
			...this.gameObjects[GameObjectType.EnemyBullet],
			...this.gameObjects[GameObjectType.Asteroid],
			...this.gameObjects[GameObjectType.Enemy],
		].forEach((enemy) => {
			enemy.setMaxVisibleDistance(distance);
		});
	};

	initialise = () => {
		console.log('SceneManager initialised');

		const spaceshipSize = 0.5;

		const spaceship = new Spaceship({
			size: spaceshipSize,
			getGameObjectsToAdd: () => this.gameObjectsToAdd,
			explosionEngine: this.explosionEngine,
			maxVisibleDistance: this.maxVisibleDistance,
		});

		this.spaceship = spaceship;
		this.addToScene([spaceship]);

		this.addRandomAsteroids(this.totalAsteroidsTarget, 2, this.maxVisibleDistance + 5);
	};

	dispose = () => {
		console.log('SceneManager disposed');
		// clear objects from scene
		this.threeEngine.removeFromScene(this.sceneObjectArray.map((object) => object._object3d));
		this.sceneObjectArray = [];

		this.gameObjects = createBlankGameObjectMap();

		this.gameObjectsToAdd = createBlankGameObjectMap();

		this.spaceship = undefined;
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

	getAllBullets = () => [
		...this.gameObjects[GameObjectType.SpaceshipBullet],
		...this.gameObjects[GameObjectType.EnemyBullet],
	];

	fulfillGameObjectTargets = () => {
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
	};

	animate = () => {
		// run animation function on all objects
		this.sceneObjectArray.forEach((object) => object.animate());
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

	addAsteroidFragments = (...asteroidFragments: AsteroidFragment[]) => {
		this.gameObjectsToAdd[GameObjectType.FadingArtifact].push(...asteroidFragments);
	};

	addAsteroids = (...asteroids: Asteroid[]) => {
		this.gameObjectsToAdd[GameObjectType.Asteroid].push(...asteroids);
	};

	addFadingArtifacts = (...artifacts: FadingArtifact[]) => {
		this.gameObjectsToAdd[GameObjectType.FadingArtifact].push(...artifacts);
	};

	addRandomAsteroids = (amount: number, minDistance: number, maxDistance: number) => {
		const spaceship = this.getSpaceship();

		for (let i = 0; i < amount; i++) {
			const randomAngle = Math.random() * Math.PI * 2;
			const randomDistance = Math.random() * (maxDistance - minDistance) + minDistance;
			const randomAsteroidSize = Math.random() > 0.5 ? AsteroidSize.LARGE : AsteroidSize.SMALL;
			this.addAsteroids(
				new Asteroid({
					size: randomAsteroidSize,
					startingPosition: {
						x: spaceship._object3d.position.x + Math.sin(randomAngle) * randomDistance,
						y: spaceship._object3d.position.y + Math.cos(randomAngle) * randomDistance,
					},
					maxVisibleDistance: this.maxVisibleDistance,
					addAsteroids: this.addAsteroids,
					addAsteroidFragments: this.addAsteroidFragments,
					explosionEngine: this.explosionEngine,
				}),
			);
		}
	};

	addRandomLightEnemies = (amount: number, minDistance: number, maxDistance: number) => {
		const spaceship = this.getSpaceship();

		for (let i = 0; i < amount; i++) {
			const randomAngle = Math.random() * Math.PI * 2;
			const randomDistance = Math.random() * (maxDistance - minDistance) + minDistance;
			const EnemyClass = Math.random() > 0.5 ? LightEnemyA : LightEnemyB;
			const enemy = new EnemyClass({
				startingPosition: {
					x: spaceship._object3d.position.x + Math.sin(randomAngle) * randomDistance,
					y: spaceship._object3d.position.y + Math.cos(randomAngle) * randomDistance,
				},
				getGameObjectsToAdd: () => this.gameObjectsToAdd,
				explosionEngine: this.explosionEngine,
				maxVisibleDistance: this.maxVisibleDistance,
			});
			this.gameObjectsToAdd[GameObjectType.Enemy].push(enemy);
		}
	};
}
