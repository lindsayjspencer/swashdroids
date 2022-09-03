import * as THREE from 'three';
import FadingArtifact from './FadingArtifact';

export default class Particle extends FadingArtifact {
	constructor(options: {
		color: THREE.ColorRepresentation;
		size: number;
		speed: { x: number; y: number; z?: number };
		startingPosition: { x: number; y: number };
		opacity?: number;
		lifetime?: number;
	}) {
		const { color, size, speed, startingPosition, lifetime, opacity } = options;
		const material = new THREE.MeshLambertMaterial({
			side: THREE.DoubleSide,
			color: color,
			transparent: true,
			opacity: opacity || Math.random() * 0.5 + 0.5,
		});

		const geometry = new THREE.CircleGeometry(size, 12);
		const particle = new THREE.Mesh(geometry, material);

		particle.position.x = startingPosition.x;
		particle.position.y = startingPosition.y;

		super({
			mesh: particle,
			fadableMaterials: [material],
			lifetime,
		});

		this._disposableGeometries.push(geometry);
		this._disposableMaterials.push(material);
		this._meshes.push(particle);

		this.setAnimationSpeeds({
			position: speed,
		});
	}

	beforeAnimate = (frame: number) => {
		this.fade(frame);
	};
}
