(function(global) {


	// Deleted map items mess with iterator pointers, so rather than removing them mark them as deleted. Can't use undefined or null since those both valid keys so use a private symbol.
	var undefMarker = Symbol('undef');

	// NaN cannot be found in an array using indexOf, so we encode NaNs using a private symbol.
	var NaNMarker = Symbol('NaN');

	function encodeVal(data) {
		return Number.isNaN(data) ? NaNMarker : data;
	}
	function decodeVal(encodedData) {
		return (encodedData === NaNMarker) ? NaN : encodedData;
	}

	function makeIterator(setInst, getter) {
		var nextIdx = 0;
		var done = false;
		return {
			next: function() {
				if (nextIdx === setInst._values.length) done = true;
				if (!done) {
					while (setInst._values[nextIdx] === undefMarker) nextIdx++;
					return {value: getter.call(setInst, nextIdx++), done: false};
				} else {
					return {done:true};
				}
			}
		}
	}

	function calcSize(setInst) {
		var size = 0;
		for (var i=0, s=setInst._values.length; i<s; i++) {
			if (setInst._values[i] !== undefMarker) size++;
		}
		return size;
	}

	var ACCESSOR_SUPPORT = true;

	var Set = function(data) {
		this._values = [];

		// If `data` is iterable (indicated by presence of a forEach method), pre-populate the set
		data && (typeof data.forEach === 'function') && data.forEach(function (item) {
			this.add.call(this, item);
		}, this);

		if (!ACCESSOR_SUPPORT) this.size = calcSize(this);
	};

	// Some old engines do not support ES5 getters/setters.  Since Set only requires these for the size property, we can fall back to setting the size property statically each time the size of the set changes.
	try {
		Object.defineProperty(Set.prototype, 'size', {
			get: function() {
				return calcSize(this);
			}
		});
	} catch(e) {
		ACCESSOR_SUPPORT = false;
	}

	Set.prototype['add'] = function(value) {
		value = encodeVal(value);
		if (this._values.indexOf(value) === -1) {
			this._values.push(value);
			if (!ACCESSOR_SUPPORT) this.size = calcSize(this);
		}
		return this;
	};
	Set.prototype['has'] = function(value) {
		return (this._values.indexOf(encodeVal(value)) !== -1);
	};
	Set.prototype['delete'] = function(value) {
		var idx = this._values.indexOf(encodeVal(value));
		if (idx === -1) return false;
		this._values[idx] = undefMarker;
		if (!ACCESSOR_SUPPORT) this.size = calcSize(this);
		return true;
	};
	Set.prototype['clear'] = function() {
		this._values = [];
		if (!ACCESSOR_SUPPORT) this.size = 0;
	};
	Set.prototype['values'] =
	Set.prototype['keys'] = function() {
		return makeIterator(this, function(i) { return decodeVal(this._values[i]); });
	};
	Set.prototype['entries'] =
	Set.prototype[Symbol.iterator] = function() {
		return makeIterator(this, function(i) { return [decodeVal(this._values[i]), decodeVal(this._values[i])]; });
	};
	Set.prototype['forEach'] = function(callbackFn, thisArg) {
		thisArg = thisArg || global;
		var iterator = this.entries();
		result = iterator.next();
		while (result.done === false) {
			callbackFn.call(thisArg, result.value[1], result.value[0], this);
			result = iterator.next();
		}
	};
	Set.prototype['constructor'] =
	Set.prototype[Symbol.species] = Set;

	Set.length = 0;

	// Export the object
	this.Set = Set;

})(this);