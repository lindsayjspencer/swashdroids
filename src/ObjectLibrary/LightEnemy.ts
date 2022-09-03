import { GameObjectsMap } from 'Engines/GameEngine';
import * as THREE from 'three';
import Enemy from './Enemy';

export default class LightEnemy extends Enemy {
	constructor(mesh: THREE.Mesh, getGameObjectsToAdd: () => GameObjectsMap) {
		super({
			mesh,
			getGameObjectsToAdd,
			targetAngle: Math.random() * (Math.PI / 2) - Math.PI / 4,
			bulletFireOffset: Math.floor(Math.random() * 60),
			bulletFirePeriod: 60,
			exhaustColour: 0xf505ed,
			exhaustParticlesPerSecond: 30,
			maxAcceleration: 0.001,
			dragFactor: 0.97,
			decelerateDistance: 2,
		});
	}

	beforeAnimate = (frame: number) => {
		this.headTowardsSpaceship(frame);
	};
}
