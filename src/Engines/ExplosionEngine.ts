import Particle from 'ObjectLibrary/Particle';
import { ColorRepresentation } from 'three';
import NumberHelper, { NumberOrFunction } from 'Helpers/NumberHelper';
import FadingArtifact from 'ObjectLibrary/FadingArtifact';

export default class ExplosionEngine {
	addFadingArtifacts: (...artifacts: FadingArtifact[]) => void;
	constructor(addFadingArtifacts: (...artifacts: FadingArtifact[]) => void) {
		this.addFadingArtifacts = addFadingArtifacts;
	}

	particleExplosion = (options: {
		amount: NumberOrFunction;
		colour: ColorRepresentation;
		size: NumberOrFunction;
		xySpeed: NumberOrFunction;
		zSpeed: NumberOrFunction;
		minZSpeed: NumberOrFunction;
		position: Required<ParticleExplosionPosition>;
		lifetime: NumberOrFunction;
		opacity: NumberOrFunction;
		angle: NumberOrFunction;
	}) => {
		const { amount, colour, size, xySpeed, zSpeed, minZSpeed, position, lifetime, opacity, angle } = options;
		const particlesToAdd: Particle[] = [];
		for (let i = 0; i < amount; i++) {
			const _xySpeed = NumberHelper.returnNumber(xySpeed);
			const _zSpeed = NumberHelper.returnNumber(zSpeed);
			const _minZSpeed = NumberHelper.returnNumber(minZSpeed);
			const xOffset = NumberHelper.returnNumber(position.xOffset);
			const yOffset = NumberHelper.returnNumber(position.yOffset);
			const spread = NumberHelper.returnNumber(position.spread);
			const _angle = NumberHelper.returnNumber(angle);
			const xSpeed = (Math.sin(_angle) * _xySpeed) / Math.max(_minZSpeed, _zSpeed);
			const ySpeed = (Math.cos(_angle) * _xySpeed) / Math.max(_minZSpeed, _zSpeed);
			const particle = new Particle({
				color: colour,
				size: NumberHelper.returnNumber(size),
				speed: {
					x: xSpeed,
					y: ySpeed,
					z: _zSpeed,
				},
				startingPosition: {
					x: NumberHelper.returnNumber(position.x) + xOffset + spread * xSpeed,
					y: NumberHelper.returnNumber(position.y) + yOffset + spread * ySpeed,
				},
				opacity: NumberHelper.returnNumber(opacity),
				lifetime: NumberHelper.returnNumber(lifetime),
			});
			particlesToAdd.push(particle);
		}
		return particlesToAdd;
	};

	addExplosion: IAddExplosion = (impact, blowback, explosion) => {
		// Impact particles
		const impactParticles = this.particleExplosion({
			amount: impact.particles?.amount ?? 3,
			colour: impact.particles?.colour ?? 0xf5aa42,
			size: impact.particles?.size ?? 0.03,
			xySpeed: impact.particles?.xySpeed ?? (() => Math.random() * 0.07 + 0.02),
			zSpeed: impact.particles?.zSpeed ?? (() => Math.random() * 1.5 - 0.75),
			minZSpeed: impact.particles?.minZSpeed ?? 1,
			lifetime: impact.particles?.lifetime ?? (() => Math.random() * 0.5 + 0.2),
			opacity: impact.particles?.opacity ?? (() => Math.random()),
			position: {
				x: impact.position.x,
				y: impact.position.y,
				xOffset: impact.position.xOffset ?? (() => Math.random() * 0.08 - 0.04),
				yOffset: impact.position.yOffset ?? (() => Math.random() * 0.08 - 0.04),
				spread: impact.particles?.spread ?? Math.random() * 0.08 - 0.04,
			},
			angle: impact.angle ?? (() => Math.random() * Math.PI * 2),
		});
		this.addFadingArtifacts(...impactParticles);
		// Blowback particles
		const blowbackParticles = this.particleExplosion({
			amount: blowback.particles?.amount ?? 12,
			colour: blowback.particles?.colour ?? 0xf5aa42,
			size: blowback.particles?.size ?? 0.03,
			xySpeed: blowback.particles?.xySpeed ?? (() => Math.random() * 0.04 + 0.02),
			zSpeed: blowback.particles?.zSpeed ?? (() => Math.random() * 1.5 - 0.75),
			minZSpeed: blowback.particles?.minZSpeed ?? 1,
			lifetime: blowback.particles?.lifetime ?? (() => Math.random() * 0.5),
			opacity: blowback.particles?.opacity ?? (() => Math.random()),
			position: {
				x: blowback.position.x,
				y: blowback.position.y,
				xOffset: blowback.position.xOffset ?? (() => Math.random() * 0.08 - 0.04),
				yOffset: blowback.position.yOffset ?? (() => Math.random() * 0.08 - 0.04),
				spread: blowback.particles?.spread ?? Math.random() * 0.08 - 0.04,
			},
			angle: blowback.angle ?? (() => Math.random() * Math.PI * 2),
		});
		this.addFadingArtifacts(...blowbackParticles);
		// Explosion particles
		const explosionParticles = this.particleExplosion({
			amount: explosion.particles?.amount ?? 12,
			colour: explosion.particles?.colour ?? 0x000000,
			size: explosion.particles?.size ?? 0.02,
			xySpeed: explosion.particles?.xySpeed ?? (() => Math.random() * 0.01 + 0.01),
			zSpeed: explosion.particles?.zSpeed ?? (() => Math.random() * 1.5),
			minZSpeed: explosion.particles?.minZSpeed ?? 0.5,
			lifetime: explosion.particles?.lifetime ?? (() => Math.random() * 0.5),
			opacity: explosion.particles?.opacity ?? (() => Math.random()),
			position: {
				x: explosion.position.x,
				y: explosion.position.y,
				xOffset: explosion.position.xOffset ?? (() => Math.random() * 0.08 - 0.04),
				yOffset: explosion.position.yOffset ?? (() => Math.random() * 0.08 - 0.04),
				spread: explosion.particles?.spread ?? (() => Math.random() * 0.03 + 0.03),
			},
			angle: explosion.angle ?? (() => Math.random() * Math.PI * 2),
		});
		this.addFadingArtifacts(...explosionParticles);
	};
}

export type IAddExplosion = (
	impact: IParticleExplosion,
	blowback: IParticleExplosion,
	explosion: IParticleExplosion,
) => void;

export type IParticleExplosion = {
	angle?: NumberOrFunction;
	position: ParticleExplosionPosition;
	particles?: ParticleExplosionOptions;
};

export type ParticleExplosionPosition = {
	x: NumberOrFunction;
	y: NumberOrFunction;
	xOffset?: NumberOrFunction;
	yOffset?: NumberOrFunction;
	spread?: NumberOrFunction;
};

export type ParticleExplosionOptions = {
	colour?: ColorRepresentation;
	amount?: NumberOrFunction;
	size?: NumberOrFunction;
	opacity?: NumberOrFunction;
	lifetime?: NumberOrFunction;
	xySpeed?: NumberOrFunction;
	zSpeed?: NumberOrFunction;
	minZSpeed?: NumberOrFunction;
	offset?: NumberOrFunction;
	spread?: NumberOrFunction;
};
