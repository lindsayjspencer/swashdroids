import * as THREE from 'three';
import Enemy from './Enemy';

export default class LightEnemy extends Enemy {
	constructor(mesh: THREE.Mesh) {
		super(mesh);

		this.targetAngle = Math.random() * (Math.PI / 2) - Math.PI / 4;
		this.bulletFireOffset = Math.floor(Math.random() * 60);
		this.bulletFirePeriod = 60;
		this.exhaustColour = 0xf505ed;
		this.exhaustParticlesPerSecond = 30;
		this.maxAcceleration = 0.002;
		this.dragFactor = 0.97;
		this.decelerateDistance = 2;
	}
}
