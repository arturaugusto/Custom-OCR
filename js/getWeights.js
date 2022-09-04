function getWeights(dataUrl, groundTruth, targetCanvasWrapId) {
  return new Promise((resolve, reject) => {
    var img = new Image();
    img.src = dataUrl;
    let doPipeline = groundTruth !== undefined
    img.onload = () => {
      preprocess(img, dataUrl, doPipeline, (canvasProcessed) => {
        if (targetCanvasWrapId) {
          let canvasProcessedContainer = document.getElementById(targetCanvasWrapId);
          canvasProcessedContainer.innerHTML = "";
          canvasProcessedContainer.appendChild(canvasProcessed);
        }
        
        clusterize(canvasProcessed, elVal("eps"), elVal("min_points")).then(groupsArray => {
          let ctx = canvasProcessed.getContext('2d')
          let weights = computeWeights(groupsArray, ctx, groundTruth)
          resolve([weights, groupsArray, ctx])
        })
      });
    }
    URL.revokeObjectURL(dataUrl)
  })
}