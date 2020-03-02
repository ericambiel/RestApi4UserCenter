const _ = require('./node_modules/lodash');
const deepmerge = require ('deepmerge')

var json0 = {
    "id": 2,
    "winner": "Param",
    "strenths": ["fly", "fight", "speed"],
};

var json1 = {
    "id": 2,
    "winner": "Aquaman",
    "strenths": ['teste1', 'teste']
};

const merged = deepmerge (json0, json1, {
    arrayMerge: (destination, source) => {
        return [ ...destination, ...source]
    }
});

console.log(merged);