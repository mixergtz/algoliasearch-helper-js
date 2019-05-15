'use strict';
const merge = require('../../../src/functions/merge');

it('should merge `source` into `object`', function() {
  var names = {
    characters: [{name: 'barney'}, {name: 'fred'}]
  };

  var ages = {
    characters: [{age: 36}, {age: 40}]
  };

  var heights = {
    characters: [{height: '5\'4"'}, {height: '5\'5"'}]
  };

  var expected = {
    characters: [
      {name: 'barney', age: 36, height: '5\'4"'},
      {name: 'fred', age: 40, height: '5\'5"'}
    ]
  };

  expect(merge(names, ages, heights)).toEqual(expected);
});

it('should work with four arguments', function() {
  var expected = {a: 4};
  var actual = merge({a: 1}, {a: 2}, {a: 3}, expected);

  expect(actual).toEqual(expected);
});

it('should merge onto function `object` values', function() {
  function Foo() {}

  var source = {a: 1};
  var actual = merge(Foo, source);

  expect(actual).toEqual(Foo);
  expect(Foo.a).toEqual(1);
});

it('should merge first source object properties to function', function() {
  var fn = function() {};
  var object = {prop: {}};
  var actual = merge({prop: fn}, object);

  expect(actual.prop).toBeInstanceOf(Function);
});

// TODO: differs from lodash, but seems to make more sense to me
it('should merge first and second source object properties to function', function() {
  var fn = function() {};
  var object = {prop: {dogs: 'out'}};
  var actual = merge({prop: fn}, {prop: fn}, object);

  expect(actual.prop).toBe(fn);
  expect(actual.prop.dogs).toBe('out');
});

it('should merge onto non-plain `object` values', function() {
  function Foo() {}

  var object = new Foo();
  var actual = merge(object, {a: 1});

  expect(actual).toBe(object);
  expect(object.a).toBe(1);
});

it('should assign `null` values', function() {
  var actual = merge({a: 1}, {a: null});
  expect(actual.a).toBe(null);
});

it('should not augment source objects for inner objects', function() {
  var source1 = {a: [{a: 1}]};
  var source2 = {a: [{b: 2}]};
  var actual = merge({}, source1, source2);

  expect(source1.a).toEqual([{a: 1}]);
  expect(source2.a).toEqual([{b: 2}]);
  expect(actual.a).toEqual([{a: 1, b: 2}]);
});

it('should not augment source objects for inner arrays', function() {
  var source1 = {a: [[1, 2, 3]]};
  var source2 = {a: [[3, 4]]};
  var actual = merge({}, source1, source2);

  expect(source1.a).toEqual([[1, 2, 3]]);
  expect(source2.a).toEqual([[3, 4]]);
  expect(actual.a).toEqual([[3, 4, 3]]);
});

it('should merge plain objects onto non-plain objects', function() {
  function Foo(object) {
    Object.assign(this, object);
  }

  var object = {a: 1};
  var actual = merge(new Foo(), object);

  expect(actual instanceof Foo).toBe(true);
  expect(actual).toEqual(new Foo(object));

  actual = merge([new Foo()], [object]);
  expect(actual[0] instanceof Foo).toBe(true);
  expect(actual).toEqual([new Foo(object)]);
});

it('should not overwrite existing values with `undefined` values of object sources', function() {
  var actual = merge({a: 1}, {a: undefined, b: undefined});
  expect(actual).toEqual({a: 1, b: undefined});
});

it('should not overwrite existing values with `undefined` values of array sources', function() {
  var array = [1];
  array[2] = 3;

  var actual = merge([4, 5, 6], array);
  var expected = [1, 5, 3];

  expect(actual).toEqual(expected);

  array = [1, undefined, 3];

  actual = merge([4, 5, 6], array);
  expect(actual).toEqual(expected);
});

it('should skip merging when `object` and `source` are the same value', function() {
  var object = {};
  var pass = true;

  Object.defineProperty(object, 'a', {
    configurable: true,
    enumerable: true,
    get: function() {
      pass = false;
    },
    set: function() {
      pass = false;
    }
  });

  merge(object, object);
  expect(pass).toBe(true);
});

it('should not convert objects to arrays when merging arrays of `source`', function() {
  var object = {a: {'1': 'y', 'b': 'z', 'length': 2}};
  var actual = merge(object, {a: ['x']});

  expect(actual).toEqual({a: {
    '0': 'x',
    '1': 'y',
    'b': 'z',
    'length': 2
  }});

  actual = merge({a: {}}, {a: []});
  expect(actual).toEqual({a: {}});
});

it('should not convert strings to arrays when merging arrays of `source`', function() {
  var object = {a: 'abcde'};
  var actual = merge(object, {a: ['x', 'y', 'z']});

  expect(actual).toEqual({a: ['x', 'y', 'z']});
});

it('should return an object for null', function() {
  expect(merge(null, {})).toEqual({});
  expect(merge({this: 'b'}, {this: 'k'}, {this: null})).toEqual({this: null});
  expect(merge({this: 'b'}, {this: null}, {this: undefined})).toEqual({this: null});
  expect(merge({this: 'b'}, {this: null}, {this: 'k'})).toEqual({this: 'k'});
});
