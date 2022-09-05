import { GameObjectsMap, IAddExplosion } from 'Engines/GameEngine';
import * as THREE from 'three';
import LightEnemy from './LightEnemy';

const baseSize = 0.25;

const material = new THREE.MeshLambertMaterial({
	color: 0x656363,
});

export default class LightEnemyA extends LightEnemy {
	constructor(
		options: {
			startingPosition: { x: number; y: number };
			getGameObjectsToAdd: () => GameObjectsMap;
			addExplosion: IAddExplosion;
		},
		size: number,
		maxVisibleDistance: number,
	) {
		const calculatedSize = baseSize * size;
		const startingPosition = options.startingPosition;
		// create enemy shape
		const geometry = new THREE.PlaneGeometry(calculatedSize, calculatedSize);

		const enemy = new THREE.Mesh(geometry, material);

		enemy.position.x = startingPosition.x;
		enemy.position.y = startingPosition.y;

		super({
			mesh: enemy,
			getGameObjectsToAdd: options.getGameObjectsToAdd,
			hitboxRadius: calculatedSize * 0.8,
			addExplosion: options.addExplosion,
			firesBullets: true,
		});

		this.setMaxVisibleDistance(maxVisibleDistance);

		this.health = 2;
	}
}