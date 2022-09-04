import * as THREE from 'three';
import GameObject from './GameObject';

const material = new THREE.MeshLambertMaterial({
	side: THREE.DoubleSide,
	color: 0x000000,
});
export default class Bullet extends GameObject {
	damage: number;
	constructor(
		size: number,
		speed: { x: number; y: number },
		startingPosition: { x: number; y: number },
		maxVisibleDistance: number,
	) {
		const geometry = new THREE.CircleGeometry(size, 12);
		const bullet = new THREE.Mesh(geometry, material);

		bullet.position.x = startingPosition.x;
		bullet.position.y = startingPosition.y;

		super(bullet);

		this.damage = 1;

		this.setMaxVisibleDistance(maxVisibleDistance);

		this._disposableGeometries.push(geometry);
		this._meshes.push(bullet);

		this.setAnimationSpeeds({
			position: speed,
		});
	}

	beforeAnimate = (frame: number) => {
		const distanceToSpacehip = this.getDistanceToSpaceship();
		const maxVisibleDistance = this.getMaxVisibleDistance();
		if (distanceToSpacehip === undefined || maxVisibleDistance === undefined) return;
		if (distanceToSpacehip > maxVisibleDistance) {
			this.setShouldRemove(true);
		}
	};
}
