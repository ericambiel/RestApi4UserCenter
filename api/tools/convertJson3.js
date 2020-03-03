const firstArr = {
        "id": 2,
        "winner": "Aquaman",
        "strenths": ['teste1', 'teste']
};
  
const secondArr = [
    {
        "id": 2,
        "winner": "Param",
        "strenths": ["fly", "fight", "speed"],
    },
    {
        "id": 2,
        "winner": "Aquaman",
        "strenths": ['teste1', 'teste']
    }]
  ;

const merged = {
    ...firstArr, ...secondArr[0],
    //id: { ...firstArr.id, ...secondArr.id},
    strenths: [ ...firstArr.strenths, ...secondArr[0].strenths]
}

console.log(merged)