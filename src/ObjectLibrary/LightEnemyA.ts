import ExplosionEngine from 'Engines/ExplosionEngine';
import objectMeshCreator from 'Helpers/ObjectMeshCreator';
import { GameObjectsMap } from 'Managers/SceneManager';
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

		// // create enemy mesh
		// const geometry = new THREE.PlaneGeometry(calculatedSize, calculatedSize);
		// const enemy = new THREE.Mesh(geometry, material);

		const { mesh, geometries, materials, boundingBox } = objectMeshCreator.createLightEnemyA();

		// Position mesh
		mesh.position.x = options.startingPosition.x;
		mesh.position.y = options.startingPosition.y;

		super(mesh);

		// Make ThreeJS objects disposable
		this._disposableGeometries.push(...geometries);
		this._disposableMaterials.push(...materials);

		// Setup internal functions that access the game engine
		this.setMaxVisibleDistance(options.maxVisibleDistance);
		this.getGameObjectsToAdd = options.getGameObjectsToAdd;
		this.explosionEngine = options.explosionEngine;

		// Health
		this.health = 1;
		this.hitboxRadius = boundingBox.max.x;

		// Behaviour ------------------------------
		// This enemy will not fire bullets, instead it will try to run directly into the spaceship
		this.decelerateDistance = 0;
		this.dragFactor = 0.95;
		this.rotationFactor = 0.15;
		this.targetAngle = 0;
		this.firesBullets = false;
	}
}
