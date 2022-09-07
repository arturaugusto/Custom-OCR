function computeWeights(groupsArray, ctx, groundTruth) {
  
  
  let baseY = Math.max(...groupsArray.map(group => group.y1))
  let topY = Math.min(...groupsArray.map(group => group.y0))
  let lineHeigth = baseY-topY

  let heigthMax = Math.max(...groupsArray.map(group => group.y1-group.y0))
  let widthMax = Math.max(...groupsArray.map(group => group.x1-group.x0))

  return groupsArray.map((group, groupIndex) => {
    let width = group.x1-group.x0
    let heigth = group.y1-group.y0
    let imageData = ctx.getImageData(group.x0, group.y0, width, heigth)
    // let imageData = ctx.getImageData(group.x0, topY, width, lineHeigth)
    
    let xyObjectArray = toXYObjectArray(imageData.data, width, 4)
    
    let mat = xyObjectArray.reduce((a, c) => {
      if (a.length-1 !== c.y) a.push([])
      let row = a[a.length -1]
      row.push(c.val ? 1 : 0)
      return a
    }, [[]])

    // show numbers on console
    // console.log(mat.map(row => row.join('').replaceAll('0',' ').replaceAll('1','#')))
    
    let aspectRatio = mat[0].length/mat.length
    let matResize = resizeArray(mat, 128).map(row => resizeArray(row, 128))

    let signal = matResize.flat()
    
    // const f = new FFTJS(signal.length)
    // let fftOut = f.createComplexArray();
    // f.realTransform(fftOut, signal);

    // fftOut = fftOut.map(x => x*x)
    // let max = Math.max(...fftOut)
    // fftOut = fftOut.map(x => Math.log10(x))
    // let mean = fftOut.filter(x => isFinite(x)).reduce((a, c) => a+c, 0)/fftOut.length
    // // console.log(mean)
    // fftOut = fftOut.map(x => x > mean ? 1 : 0)

    // console.log(fftOut)
    
    return {
      widthNorm: width/widthMax,
      heigthNorm: heigth/heigthMax,
      aspectRatio: aspectRatio,
      
      // data: fftOut.concat(signal),
      data: signal,
      // data: fftOut,
      
      baseY: baseY,
      topY: topY,
      isPunctuation: group.y0-baseY < (topY-baseY)/2,
      isThin: aspectRatio < 0.3, // todo: check for 7
      char: groundTruth ? groundTruth[groupIndex] : undefined
    }
  })
}