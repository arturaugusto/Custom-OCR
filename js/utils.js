let resizeArray = function(arr, size) {
  /**
   * arr: Array
   * size: Number
   * 
   * example:
   * resizeArray([1,1,1,1,0,0,0,0,1,1], 5) === [1, 1, 0, 0, 1]]
   * resizeArray([1, 1, 0, 0, 1], 10) === [1, 1, 1, 1, 0, 0, 0, 0, 1, 1]
   * 
   * */
  let res = Array(size).fill()
  for (let i = 0; i < size; i++) {
    res[i] = arr[Math.floor(i/size * arr.length)]
  }
  return res
}


let toXYObjectArray = function(data, width, skip) {
  /**
   * data: Array
   * skip: Number
   * width: Number
   * 
   * dataToObjectMat([1,2,3,4,5,6,7,8,9], 3, 1) === [
   *  {x: 0, y: 0, val: 1},
   *  {x: 1, y: 0, val: 2},
   *  {x: 2, y: 0, val: 3},
   *  {x: 0, y: 1, val: 4},
   *  {x: 1, y: 1, val: 5},
   *  {x: 2, y: 1, val: 6},
   *  {x: 0, y: 2, val: 7},
   *  {x: 1, y: 2, val: 8},
   *  {x: 2, y: 2, val: 9},
   * ]
   * 
   * */

  skip = skip || 1
  let res = new Array(data.length/skip).fill()
  let currentRow = 0
  for (let i = 0; i < res.length; i++) {
    let x = i % width
    res[i] = {
      x: x,
      y: currentRow,
      val: data[i*skip]
    }
    if (x === width-1) currentRow += 1
  }
  return res
}

let elVal = function(elId) {
  return parseFloat(document.getElementById(elId).value)
}