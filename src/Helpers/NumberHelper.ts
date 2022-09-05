export default class NumberHelper {
	static returnNumber = (value: NumberOrFunction) => {
		if (typeof value === 'number') {
			return value;
		}
		return value();
	};
}

export type NumberOrFunction = number | (() => number);
