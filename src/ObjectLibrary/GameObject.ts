import * as THREE from 'three';
import CanvasObject from './CanvasObject';

export default class GameObject extends CanvasObject {
	_angleToSpaceship?: number;
	_distanceToSpaceship?: number;
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

	setIsOffscreen = (isOffscreen: boolean) => {
		this._isOffscreen = isOffscreen;
	};

	getIsOffscreen = () => {
		return this._isOffscreen;
	};
}
