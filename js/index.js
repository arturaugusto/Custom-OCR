let train = function(drawBoxesFlag) {
  delete window.TRAINED_DATA
  // get selected option
  let target = document.getElementById('fontSelect')
  let groundTruth = target.selectedOptions[0].value.split(' ').filter(x => x != ' ')
  let optionElement = Array.from(target.selectedOptions)[0]
  let style = optionElement.style
  
  // target element to style
  let styledElement = document.getElementById('styledElement')
  styledElement.innerText = optionElement.value

  // set font
  styledElement.style.fontFamily = style.fontFamily

  let trained_data
  document.getElementById('styledElement').style.transform = ''
  // create image from dom
  return domtoimage.toPng(document.getElementById('styledElementWrap'))
  .then(dataUrl => {
    return getWeights(dataUrl, groundTruth, 'canvasProcessedContainer')
  })
  .then(weightsData => {
    let [weights, groupsArray, ctx] = weightsData
    drawBoxes(groupsArray, ctx)
    trained_data = JSON.parse(JSON.stringify(weights))
    document.getElementById('styledElement').style.transform = 'skew(6deg)'
    return domtoimage.toPng(document.getElementById('styledElementWrap'))
  })
  .then(dataUrl => {
    return getWeights(dataUrl, groundTruth, 'canvasProcessedContainer')
  })
  .then(weightsData => {
    let [weights, groupsArray, ctx] = weightsData
    drawBoxes(groupsArray, ctx)
    trained_data.forEach((char_weights, i) => char_weights.data = char_weights.data.concat(weights[i].data))
    document.getElementById('styledElement').style.transform = 'skew(-6deg)'
    return domtoimage.toPng(document.getElementById('styledElementWrap'))
  })
  .then(dataUrl => {
    return getWeights(dataUrl, groundTruth, 'canvasProcessedContainer')
  })
  .then(weightsData => {
    let [weights, groupsArray, ctx] = weightsData
    drawBoxes(groupsArray, ctx)
    trained_data.forEach((char_weights, i) => char_weights.data = char_weights.data.concat(weights[i].data))
    window.TRAINED_DATA = trained_data
  })
  .catch(function (error) {
      console.error('oops, something went wrong!', error);
  });
}

document.getElementById('eps').addEventListener('change', train)
document.getElementById('min_points').addEventListener('change', train)
document.getElementById('cannyLow').addEventListener('change', train)
document.getElementById('cannyHigh').addEventListener('change', train)
document.getElementById('fontSelect').addEventListener('change', train)

let doOcr = function() {
  if (window.TRAINED_DATA) {
    let segmentedCanvas = document.getElementById('segmentedCanvas')
    let dataUrl = segmentedCanvas.toDataURL()
    let segmentedCanvasHeight = segmentedCanvas.height
    
    getWeights(dataUrl, undefined, 'canvasProcessedCamContainer').then(weightsData => {
      let [weights, groupsArray, ctx] = weightsData
      let res = ocr(weights)

      drawBoxes(groupsArray, ctx)
      console.log(weights)
      console.log(res)
      document.getElementById('ocrResult').style['padding-top'] = `${segmentedCanvasHeight}px`
      document.getElementById('ocrResult').innerText = res.text
    })
  }
}


window.setInterval(doOcr, 1000)
