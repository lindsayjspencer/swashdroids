import ExplosionEngine from 'Engines/ExplosionEngine';
import { GameObjectsMap } from 'Engines/GameEngine';
import * as THREE from 'three';
import LightEnemy from './LightEnemy';

const baseSize = 0.3;

const material = new THREE.MeshLambertMaterial({
	color: 0x858383,
});

export default class LightEnemyA extends LightEnemy {
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
		this.health = 1;
		this.hitboxRadius = calculatedSize * 0.8;

		// Behaviour ------------------------------
		// This enemy will not fire bullets, instead it will try to run directly into the spaceship
		this.decelerateDistance = 0;
		this.dragFactor = 0.95;
		this.rotationFactor = 0.15;
		this.targetAngle = 0;
		this.firesBullets = false;
	}
}
