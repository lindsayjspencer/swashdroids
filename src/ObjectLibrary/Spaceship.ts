import * as THREE from 'three';
import SceneObject from './SceneObject';
import { GameKeyState } from 'Engines/GameEngine';

const maxAcceleration = 0.001;
const dragFactor = 0.99;
const rotationalDragFactor = 0.95;
const maxRotationSpeed = 0.04;
const rotationalAcceleration = 0.004;

export default class Spaceship extends SceneObject {
	acceleration = 0;
	speed = {
		x: 0,
		y: 0,
		rotation: 0,
	};

	constructor(size: number) {
		const material = new THREE.MeshPhongMaterial({ side: THREE.DoubleSide, color: 0x71bd31 });

		const shipShape = new THREE.Shape();
		shipShape.moveTo(0, 0.5 * size);
		shipShape.lineTo(0.35 * size, -0.5 * size);
		shipShape.lineTo(0, -0.25 * size);
		shipShape.lineTo(-0.35 * size, -0.5 * size);
		shipShape.lineTo(0, 0.5 * size);

		const shipGeometry = new THREE.ShapeGeometry(shipShape);
		const ship = new THREE.Mesh(shipGeometry, material);

		// outline
		const outline = new THREE.EdgesGeometry(shipGeometry);
		// thick lines
		const outlineMaterial = new THREE.LineBasicMaterial({ color: 0xa6dc79 });
		const outlineMesh = new THREE.LineSegments(outline, outlineMaterial);

		ship.add(outlineMesh);

		ship.position.x = 0;
		ship.position.y = 0;
		ship.position.z = 0;

		super(ship);

		this._disposableGeometries.push(shipGeometry, outline);
		this._disposableMaterials.push(material, outlineMaterial);
		this._meshes.push(ship);
	}

	modifySpeed = () => {
		this.speed.x += maxAcceleration * Math.cos(this._object3d.rotation.z + Math.PI / 2);
		this.speed.y += maxAcceleration * Math.sin(this._object3d.rotation.z + Math.PI / 2);
	};

	applyDrag = (modifier: number) => {
		this.speed.x *= dragFactor * modifier;
		this.speed.y *= dragFactor * modifier;
	};

	applyRotationalDrag = (modifier: number) => {
		this.speed.rotation *= rotationalDragFactor * modifier;
	};

	beforeAnimate = (frame: number, keyState: GameKeyState) => {
		if (keyState.ArrowUp) {
			this.modifySpeed();
			this.applyDrag(1);
		}
		if (keyState.ArrowLeft) {
			this.speed.rotation += rotationalAcceleration;
		}
		if (keyState.ArrowRight) {
			this.speed.rotation -= rotationalAcceleration;
		}
		if (!keyState.ArrowRight && !keyState.ArrowLeft) {
			this.applyRotationalDrag(1);
		}
		// apply min max to rotation speeds
		this.speed.rotation = Math.max(-maxRotationSpeed, Math.min(maxRotationSpeed, this.speed.rotation));
		this.setAnimationSpeeds({
			position: {
				x: this.speed.x,
				y: this.speed.y,
			},
			rotation: {
				z: this.speed.rotation,
			},
		});
	};
}
