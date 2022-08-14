import * as THREE from 'three';
import GameObject from './GameObject';

export default class Bullet extends GameObject {
	removeFromScene: () => void;
	constructor(
		size: number,
		speed: { x: number; y: number },
		startingPosition: { x: number; y: number },
		removeFromScene: () => void,
	) {
		const material = new THREE.MeshLambertMaterial({
			side: THREE.DoubleSide,
			color: 0x000000,
		});

		const geometry = new THREE.CircleGeometry(size, 12);
		const particle = new THREE.Mesh(geometry, material);

		particle.position.x = startingPosition.x;
		particle.position.y = startingPosition.y;

		super(particle);

		this.removeFromScene = removeFromScene;
		this.setAnimationSpeeds({
			position: speed,
		});
	}

	beforeAnimate = (frame: number, spaceShipPosition: { x: number; y: number }) => {
		// remove from scene if bullet is certain distance from spaceship
		const mesh = this._object3d as THREE.Mesh;
		const distance = Math.sqrt(
			Math.pow(mesh.position.x - spaceShipPosition.x, 2) + Math.pow(mesh.position.y - spaceShipPosition.y, 2),
		);
		if (distance > 100) {
			this.removeFromScene();
		}
	};
}
