import * as THREE from 'three';
import GameObject from './GameObject';

const baseSize = 0.3;
const baseCoefficient = 1;

const material = new THREE.MeshLambertMaterial({
	color: 0xeaeaea,
});
const outlineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });

export default class Asteroid extends GameObject {
	size: number;
	constructor(
		size: number,
		sides: number,
		speed: { x: number; y: number },
		startingPosition: { x: number; y: number },
		maxVisibleDistance: number,
	) {
		const calculatedSize = baseSize * size;
		// create ateroid shape
		const asteroidShape = new THREE.Shape();
		asteroidShape.moveTo(calculatedSize, 0);
		const coefficient = baseCoefficient / sides;
		for (let i = 1; i < sides; i++) {
			const randomMovement = Math.random() * calculatedSize * coefficient - (calculatedSize * coefficient) / 2;
			asteroidShape.lineTo(
				Math.cos((i * 2 * Math.PI) / sides) * calculatedSize + randomMovement,
				Math.sin((i * 2 * Math.PI) / sides) * calculatedSize + randomMovement,
			);
		}

		const geometry = new THREE.ShapeGeometry(asteroidShape);
		const asteroid = new THREE.Mesh(geometry, material);

		// asteroid outline
		const outline = new THREE.EdgesGeometry(geometry);
		const outlineMesh = new THREE.LineSegments(outline, outlineMaterial);

		asteroid.add(outlineMesh);

		asteroid.position.x = startingPosition.x;
		asteroid.position.y = startingPosition.y;

		super(asteroid);
		this.size = calculatedSize;

		this._disposableGeometries.push(geometry, outline);
		this._meshes.push(asteroid);

		this.setMaxVisibleDistance(maxVisibleDistance);

		this.setAnimationSpeeds({
			position: speed,
		});
	}

	beforeAnimate = (frame: number) => {
		const distanceToSpacehip = this.getDistanceToSpaceship();
		const maxVisibleDistance = this.getMaxVisibleDistance();
		if (distanceToSpacehip === undefined || maxVisibleDistance === undefined) return;
		if (distanceToSpacehip > maxVisibleDistance + 5) {
			this.setShouldRemove(true);
		}
		if (distanceToSpacehip <= this.size + 0.1) {
			this.setShouldRemove(true);
		}
	};

	checkCollisionWith = (arg: GameObject) => {
		//
	};
}
