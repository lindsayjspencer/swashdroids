import ExplosionEngine from 'Engines/ExplosionEngine';
import { GameObjectsMap } from 'Engines/GameEngine';
import * as THREE from 'three';
import LightEnemy from './LightEnemy';

const baseSize = 0.25;

const material = new THREE.MeshLambertMaterial({
	color: 0x656363,
});

export default class LightEnemyB extends LightEnemy {
	constructor(options: {
		startingPosition: { x: number; y: number };
		getGameObjectsToAdd: () => GameObjectsMap;
		explosionEngine: ExplosionEngine;
		size?: number;
		maxVisibleDistance: number;
	}) {
		const calculatedSize = baseSize * (options.size ?? 1);

		// create enemy mesh
		const geometry = new THREE.PlaneGeometry(calculatedSize, calculatedSize);
		const enemy = new THREE.Mesh(geometry, material);

		// Position mesh
		enemy.position.x = options.startingPosition.x;
		enemy.position.y = options.startingPosition.y;

		super(enemy);

		// Make ThreeJS objects disposable
		this._disposableGeometries.push(geometry);

		// Setup internal functions that access the game engine
		this.setMaxVisibleDistance(options.maxVisibleDistance);
		this.getGameObjectsToAdd = options.getGameObjectsToAdd;
		this.explosionEngine = options.explosionEngine;

		// Health
		this.health = 2;
		this.hitboxRadius = calculatedSize * 0.8;

		// Behaviour ------------------------------
		// This enemy will try to head towards the spaceship, but the exact angle it travels at will be offset randomly by a maximum of 45 degrees.
		// This causes it to spiral. Once it gets within the decelerateDistance of the spaceship, the target angle becomes 100% accurate and it
		// will slow down to a stop and fire bullets periodically.
		this.decelerateDistance = 2;
		this.targetAngle = Math.random() * (Math.PI / 4) - Math.PI / 8;
		this.firesBullets = true;
	}
}
