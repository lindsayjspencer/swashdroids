import * as THREE from 'three';

interface AnimationSpeeds {
	position: AnimationSpeedSet;
	rotation: AnimationSpeedSet;
}

interface AnimationSpeedSet {
	x: number;
	y: number;
	z: number;
}

interface PartialAnimationSpeedSet {
	x?: number;
	y?: number;
	z?: number;
}

export interface PartialAnimationSpeeds {
	position?: PartialAnimationSpeedSet;
	rotation?: PartialAnimationSpeedSet;
}

export default abstract class SceneObject {
	animationSpeed = 1;
	_disposableGeometries: THREE.BufferGeometry[] = [];
	_disposableMaterials: THREE.Material[] = [];
	_meshes: THREE.Mesh[] = [];

	_animationSpeeds: AnimationSpeeds = {
		position: {
			x: 0,
			y: 0,
			z: 0,
		},
		rotation: {
			x: 0,
			y: 0,
			z: 0,
		},
	};

	_object3d: THREE.Object3D;

	_shouldRemove = false;

	constructor(object: THREE.Object3D) {
		this._object3d = object;
	}

	setAnimationSpeeds = (speeds: PartialAnimationSpeeds) => {
		this._animationSpeeds = {
			position: {
				x: speeds.position?.x ?? this._animationSpeeds.position.x,
				y: speeds.position?.y ?? this._animationSpeeds.position.y,
				z: speeds.position?.z ?? this._animationSpeeds.position.z,
			},
			rotation: {
				x: speeds.rotation?.x ?? this._animationSpeeds.rotation.x,
				y: speeds.rotation?.y ?? this._animationSpeeds.rotation.y,
				z: speeds.rotation?.z ?? this._animationSpeeds.rotation.z,
			},
		};
	};

	setAnimationSpeed = (speed: number) => {
		this.animationSpeed = speed;
	};

	getCalculatedAnimationSpeed = (): AnimationSpeeds => {
		return {
			position: {
				x: this._animationSpeeds.position.x * this.animationSpeed,
				y: this._animationSpeeds.position.y * this.animationSpeed,
				z: this._animationSpeeds.position.z * this.animationSpeed,
			},
			rotation: {
				x: this._animationSpeeds.rotation.x * this.animationSpeed,
				y: this._animationSpeeds.rotation.y * this.animationSpeed,
				z: this._animationSpeeds.rotation.z * this.animationSpeed,
			},
		};
	};

	animate = () => {
		const speeds = this.getCalculatedAnimationSpeed();
		this._object3d.position.x += speeds.position.x;
		this._object3d.position.y += speeds.position.y;
		this._object3d.position.z += speeds.position.z;
		this._object3d.rotation.x += speeds.rotation.x;
		this._object3d.rotation.y += speeds.rotation.y;
		this._object3d.rotation.z += speeds.rotation.z;
	};

	getShouldRemove = () => {
		return this._shouldRemove;
	};

	setShouldRemove = (shouldRemove: boolean) => {
		this._shouldRemove = shouldRemove;
	};

	dispose = () => {
		this._disposableGeometries.forEach((geometry) => geometry.dispose());
		this._disposableMaterials.forEach((material) => material.dispose());
	};
}
