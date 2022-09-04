function preprocess(img, dataUrl, doFullPipeline, cb) {
  const width = img.width;
  const height = img.height;

  // load image from URL or base64 string and store a result in input tensor
  gm.imageTensorFromURL(dataUrl, 'uint8', [height, width, 4], true).then((input) => {
    
    // detec if whe shoud invert the image
    // let imageSum = 0
    // for (let i = 0; i < input.data.length; i=i+input.shape[2]) {
    //   if (input.data[i]) imageSum += 1
    // }
    // let invertBool = (imageSum/(input.data.length/input.shape[2])) > 0.8
    let invertBool = true

    // the input is already a valid operation that can be chained
    // notice the use of 'let'. We are going to reuse the pipeline variable
    let pipeline = input

    // operations always return a valid input for another operation.
    // if you are a functional programmer, you could easily compose these.
    pipeline = gm.grayscale(pipeline);
    
    if (doFullPipeline) {
      
      pipeline = gm.norm(pipeline, 'l2') //minmax
      // pipeline = gm.gaussianBlur(pipeline, 3, 3);
      pipeline = gm.adaptiveThreshold(pipeline, 100, 10);
      
      if (invertBool) {
        const whiteTensor = new gm.Tensor('uint8', [height, width, 4]);
        whiteTensor.data.fill(255);
        pipeline = gm.sub(whiteTensor, pipeline);
      }
      
      // pipeline = gm.sobelOperator(pipeline);
      // pipeline = gm.cannyEdges(pipeline, 0.25, 0.75);      
      pipeline = gm.dilate(pipeline, [1, 3]);
      // pipeline = gm.erode(pipeline, [1, 3]);

      // pipeline = gm.cannyEdges(pipeline, parseFloat(document.getElementById('cannyLow').value), parseFloat(document.getElementById('cannyHigh').value));
    }
    let downsample = height/100
    
    if (downsample > 1) {
      pipeline = gm.downsample(pipeline, downsample, 'mean');
    }


    // allocate output tensor
    const output = gm.tensorFrom(pipeline);
    const sess = new gm.Session();

    sess.init(pipeline);

    // run your operation
    sess.runOp(pipeline, 0, output);

    // display your output
    // const canvasOriginal = gm.canvasCreate(width, height);
    const canvasProcessed = gm.canvasCreate(width, height);

    // canvasProcessed.addEventListener('mousemove', function(evt) {
    //   let rect = evt.target.getBoundingClientRect();
    //   document.getElementById('canvasProcessedX').innerText = Math.round(evt.clientX - rect.left)
    //   document.getElementById('canvasProcessedY').innerText = Math.round(evt.clientY - rect.top)
    // }, false)

    canvasProcessed.setAttribute('id', 'canvasProcessed');

    // canvasProcessed.style['shape-rendering'] = 'crispedges'
    // canvasProcessed.style['image-rendering'] = 'pixelated'

    gm.canvasFromTensor(canvasProcessed, output);
    cb(canvasProcessed)
  })
}