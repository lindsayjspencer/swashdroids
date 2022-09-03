import * as THREE from 'three';
import FadingArtifact from './FadingArtifact';
import { PartialAnimationSpeeds } from './SceneObject';

export default class AsteroidFragment extends FadingArtifact {
	constructor(options: {
		color: THREE.ColorRepresentation;
		size: number;
		sides?: number;
		startingPosition: { x: number; y: number };
		startingRotation?: number;
		animationSpeeds?: PartialAnimationSpeeds;
		opacity?: number;
		lifetime?: number;
	}) {
		const size = options.size;
		const sides = options.sides || 3;
		const animationSpeeds = options.animationSpeeds || ({} as PartialAnimationSpeeds);
		const startingPosition = options.startingPosition || { x: 0, y: 0 };
		const startingRotation = options.startingRotation || 0;
		const lifetime = options.lifetime;
		const opacity = options.opacity || Math.random() * 0.5 + 0.5;
		const material = new THREE.MeshLambertMaterial({
			color: 0xeaeaea,
			transparent: true,
			opacity,
		});
		const outlineMaterial = new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity });

		// create ateroid shape
		const asteroidShape = new THREE.Shape();
		asteroidShape.moveTo(size, 0);
		for (let i = 1; i < sides; i++) {
			const randomMovement = Math.random() * size * sides - (size * sides) / 2;
			asteroidShape.lineTo(
				Math.cos((i * 2 * Math.PI) / sides) * size + randomMovement,
				Math.sin((i * 2 * Math.PI) / sides) * size + randomMovement,
			);
		}

		const geometry = new THREE.ShapeGeometry(asteroidShape);
		const asteroidFragment = new THREE.Mesh(geometry, material);

		// asteroid outline
		const outline = new THREE.EdgesGeometry(geometry);
		const outlineMesh = new THREE.LineSegments(outline, outlineMaterial);

		asteroidFragment.add(outlineMesh);

		asteroidFragment.position.x = startingPosition.x;
		asteroidFragment.position.y = startingPosition.y;

		asteroidFragment.rotation.z = startingRotation;

		super({
			mesh: asteroidFragment,
			fadableMaterials: [material, outlineMaterial],
			lifetime,
		});

		this._disposableGeometries.push(geometry);
		this._disposableMaterials.push(material, outlineMaterial);
		this._meshes.push(asteroidFragment);

		this.setAnimationSpeeds({
			position: animationSpeeds.position || {
				x: Math.random() * 0.01 - 0.005,
				y: Math.random() * 0.01 - 0.005,
			},
			rotation: {
				z: animationSpeeds.rotation?.z || 0,
			},
		});
	}

	beforeAnimate = (frame: number) => {
		this.fade(frame);
	};
}
