import * as THREE from 'three';
import CanvasObject from './CanvasObject';
import GeometryHelper from 'Helpers/GeometryHelper';
import { GameKeyState } from 'Services/GameEngine';

const maxAcceleration = 0.001;
const dragFactor = 0.99;
const rotationalDragFactor = 0.95;
const maxRotationSpeed = 0.04;
const rotationalAcceleration = 0.004;

export default class Spaceship extends CanvasObject {
	acceleration = 0;
	speed = {
		x: 0,
		y: 0,
		rotation: 0,
	};

	constructor(size: number) {
		const group = new THREE.Group();
		const material = new THREE.MeshPhongMaterial({ side: THREE.DoubleSide, color: 0x71bd31 });
		const leftSide = GeometryHelper.createCustomGeometryFromPoints(
			[
				new THREE.Vector3(0, 0.5 * size, 0),
				new THREE.Vector3(0.35 * size, -0.5 * size, 0),
				new THREE.Vector3(0, -0.25 * size, 0),
			],
			material,
		);

		const rightSide = GeometryHelper.createCustomGeometryFromPoints(
			[
				new THREE.Vector3(0, 0.5 * size, 0),
				new THREE.Vector3(-0.35 * size, -0.5 * size, 0),
				new THREE.Vector3(0, -0.25 * size, 0),
			],
			material,
		);

		group.add(rightSide, leftSide);

		group.position.x = 0;
		group.position.y = 0;
		group.position.z = 0;

		super(group);
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
