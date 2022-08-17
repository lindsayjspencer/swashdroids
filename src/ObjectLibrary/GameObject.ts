import * as THREE from 'three';
import SceneObject from './SceneObject';

export default class GameObject extends SceneObject {
	_angleToSpaceship?: number;
	_distanceToSpaceship?: number;
	_maxVisibleDistance?: number;
	_isOffscreen = false;

	constructor(object: THREE.Object3D) {
		super(object);
	}

	setAngleToSpaceship = (angle: number) => {
		this._angleToSpaceship = angle;
	};

	getAngleToSpaceship = () => {
		return this._angleToSpaceship;
	};

	setDistanceToSpaceship = (distance: number) => {
		this._distanceToSpaceship = distance;
	};

	getDistanceToSpaceship = () => {
		return this._distanceToSpaceship;
	};

	setMaxVisibleDistance = (distance: number) => {
		this._maxVisibleDistance = distance;
	};

	getMaxVisibleDistance = () => {
		return this._maxVisibleDistance;
	};

	setIsOffscreen = (isOffscreen: boolean) => {
		this._isOffscreen = isOffscreen;
	};

	getIsOffscreen = () => {
		return this._isOffscreen;
	};
}
