function dbscan(data) {
  let min_points = data.min_points
  let eps = data.eps// * 10000

  let dim = data.inputs[0].length
  
  let dataFlat = data.inputs.flat()

  // for (var i = dataFlat.length - 1; i >= 0; i--) {
  //   dataFlat[i] = parseInt(dataFlat[i]*10000, 10)
  // }


  let size = dataFlat.length
  
  let bufferStepSize = 2
  let buffer = Array(size/dim*bufferStepSize).fill(-1)
  // [isCore, clusterId]

  // determine core points
  for (let i = 0; i < size; i+=dim) {
    
    // skip if already core point
    if (buffer[i/dim*bufferStepSize] === 1) continue

    let closePoints = 0;

    for (let j = 0; j < size; j+=dim) {
      // if (i===j) continue // TODO: should point be compared with itself?

      // compute euclidian distance
      let sumSquare = 0
      for (let k = 0; k < dim; k++) sumSquare += Math.pow(dataFlat[i+k]-dataFlat[j+k], 2)
      if (Math.sqrt(sumSquare) < eps) closePoints += 1

      // check if point from outer loop is core
      if (closePoints >= min_points) {
        buffer[i/dim*bufferStepSize] = 1
        break
      }
    }
  }

  // expand clusters
  let clusterId = 0;
    
  function expandClusters(seeds) {
    for (let i = 0; i < seeds.length; i++) {
      let index = seeds[i]
      // skip if not core point
      if (buffer[index] !== 1) continue
      
      // if cluster not defined, set it
      if (buffer[index+1] === -1) {
        buffer[index+1] = clusterId++
      }

      for (let j = 0; j < size; j+=dim) {
        
        // skip if not core point
        if (buffer[j/dim*bufferStepSize] !== 1) continue

        // skip if cluster already assigned
        if (buffer[j/dim*bufferStepSize+1] !== -1) continue

        let seeds = []

        // compute euclidian distance
        let sumSquare = 0
        for (let k = 0; k < dim; k++) sumSquare += Math.pow(dataFlat[index+k]-dataFlat[j+k], 2)
        if (Math.sqrt(sumSquare) < eps) {
          seeds.push(j/dim*bufferStepSize)
          buffer[j/dim*bufferStepSize+1] = buffer[index+1]
        }
        if (seeds.length) expandClusters(seeds)
      }
    }
  }

  for (let i = 0; i < size; i+=dim) {
    if (buffer[i/dim*bufferStepSize] === 1 && buffer[i/dim*bufferStepSize+1] === -1) {
      expandClusters([i/dim*bufferStepSize])
      // break
    }
  }


  // // add non core points (edge) to close clusters
  // for (let i = 0; i < size; i+=dim) {
    
  //   // skip if is a core point
  //   if (buffer[i/dim*bufferStepSize] === 1) continue
    
  //   // skip if clusterId already assigned
  //   if (buffer[i/dim*bufferStepSize+1] !== -1) continue

  //   for (let j = 0; j < size; j+=dim) {

  //     // compute euclidian distance
  //     let sumSquare = 0
  //     for (let k = 0; k < dim; k++) sumSquare += Math.pow(dataFlat[i+k]-dataFlat[j+k], 2)
  //     if (Math.sqrt(sumSquare) < eps) {
  //       buffer[i/dim*bufferStepSize+1] = buffer[j/dim*bufferStepSize+1]
  //       // TODO: shoud we set anywhere that this is a edge?
  //     }
  //   }
  // }
  
  return buffer.filter((x, i) => i % 2)
}