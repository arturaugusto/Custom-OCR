function openCamera() {
  let roiCanvas = document.getElementById('roiCanvas')
  const width = 500;
  const height = 400;
  // initialize WebRTC stream and session for runing operations on GPU
  const gmStream = new gm.CaptureVideo(width, height);

  const canvasProcessed = gm.canvasCreate(width, height);
  canvasProcessed.id = 'canvasProcessed'

  const segmentedCanvas = document.getElementById('segmentedCanvas')
  const segmentedCanvasCtx = segmentedCanvas.getContext('2d')

  let segmentedCanvasCrop = document.getElementById('segmentedCanvasCrop')
  let segmentedCanvasCropCtx = segmentedCanvasCrop.getContext('2d')


  // session uses a context for optimize calculations and prevent recalculations
  // context actually a number which help algorythm to run operation efficiently  
  let context = 0;
  let input = new gm.Tensor('uint8', [height, width, 4]);
  let inputRoi = new gm.Tensor('uint8', [height, width, 4]);
  
  let sess 
  let pipeline
  let output

  //////////////////////////////////////////
  const setPipeline = () => {
    sess = new gm.Session();
    pipeline = inputRoi
    
    pipeline = gm.grayscale(pipeline);
    pipeline = gm.gaussianBlur(pipeline, 3, 3);


    if (document.getElementById('invert').checked) {
      const whiteTensor = new gm.Tensor('uint8', [height, width, 4]);
      whiteTensor.data.fill(255);
      pipeline = gm.sub(whiteTensor, pipeline);
    }

    let erodeDilateVertical = parseFloat(document.getElementById('erodeDilateVertical').value)

    if (erodeDilateVertical > 0) {
      pipeline = gm.dilate(pipeline, [1, erodeDilateVertical]);
    }
    if (erodeDilateVertical < 0) {
      pipeline = gm.erode(pipeline, [1, -erodeDilateVertical]);
    }

    let erodeDilateHorizontal = parseFloat(document.getElementById('erodeDilateHorizontal').value)

    if (erodeDilateHorizontal > 0) {
      pipeline = gm.dilate(pipeline, [erodeDilateHorizontal, 1]);
    }
    if (erodeDilateHorizontal < 0) {
      pipeline = gm.erode(pipeline, [-erodeDilateHorizontal, 1]);
    }    
    
    
    // if (document.getElementById('blur').checked) {
    //   pipeline = gm.gaussianBlur(pipeline, 3, 3);
    // }
    
    // pipeline = gm.adaptiveThreshold(pipeline, parseFloat(document.getElementById('thresholdBox').value), parseFloat(document.getElementById('threshold').value));


    // pipeline = gm.sobelOperator(pipeline);
    // pipeline = gm.cannyEdges(pipeline, 0.25, 0.75);
    
    // if (document.getElementById('dilate').checked) {
    //   pipeline = gm.dilate(pipeline, [1, 3]);
    // }
    

    // initialize graph
    sess.init(pipeline);

    // allocate output
    // const output = gm.tensorFrom(pipeline);
    output = gm.tensorFrom(pipeline);
  }
  //////////////////////////////////////////
  setPipeline()

  ;['invert', 'erodeDilateVertical', 'erodeDilateHorizontal'].forEach(op => {
    document.getElementById(op).addEventListener('change', () => {
      sess.destroy()
      setPipeline()
    })
  })



  let selCoord = {x0: 121, y0: 122, x1: 330, y1: 187}

  // create loop
  const tick = () => {
    document.getElementById('canvasWrap').style.height = `${canvasProcessed.clientHeight+20}px`
        
    

    gm.canvasFromTensor(canvasProcessed, input);
    // Read current in to the tensor
    gmStream.getImageBuffer(input);

    let roiNorm = [
      Math.min(selCoord.x0, selCoord.x1),
      Math.min(selCoord.y0, selCoord.y1),
      Math.max(selCoord.x0, selCoord.x1),
      Math.max(selCoord.y0, selCoord.y1)
    ]
    
    // segmentedCanvas.width = roiNorm[2] - roiNorm[0]
    // segmentedCanvas.height = roiNorm[3] - roiNorm[1]    

    segmentedCanvas.width = width
    segmentedCanvas.height = height


    segmentedCanvasCtx.clearRect(0,0,segmentedCanvas.width,segmentedCanvas.height)

    let t = input.clone()
    
    // set tensor pixels outside roi black/white
    let fillColor = document.getElementById('invert').checked ? 255 : 0
    for (var i = 0; i < width; i++) {
      for (var j = 0; j < height; j++) {
        if ((i < roiNorm[0] || i > roiNorm[2]) || (j < roiNorm[1] || j > roiNorm[3])) {
          t.set(j, i, 0, fillColor)
          t.set(j, i, 1, fillColor)
          t.set(j, i, 2, fillColor)
          t.set(j, i, 3, 255)
        }
      }
    }
    
    inputRoi.assign(t.data)
    
    // finaly run operation on GPU and then write result in to output tensor
    sess.runOp(pipeline, context, output);
    
    // create processed canvas
    const canvasProcessedPre = gm.canvasCreate(width, height)
    gm.canvasFromTensor(canvasProcessedPre, output)
    
    segmentedCanvasCtx.drawImage(canvasProcessedPre, 0, 0, width, height, 0, 0, width, height)



    // get roi dimensions
    let widthRoi = roiNorm[2] - roiNorm[0]
    let heightRoi = roiNorm[3] - roiNorm[1]

    
    // limit height and adjust aspec ratio
    let heightRoiResult = heightRoi
    let widthRoiResult = widthRoi
    
    let maxHeight = 75
    if (heightRoiResult > maxHeight) {
      heightRoiResult = maxHeight
      let ratio = heightRoiResult/heightRoi
      widthRoiResult = Math.round(widthRoiResult*ratio)
    }
    
    // draw on crop canvas
    segmentedCanvasCrop.width = widthRoiResult
    segmentedCanvasCrop.height = heightRoiResult
    
    segmentedCanvasCropCtx.drawImage(segmentedCanvas, roiNorm[0], roiNorm[1], widthRoi, heightRoi, 0, 0, widthRoiResult, heightRoiResult)
    
    if (widthRoiResult*heightRoiResult > 20) {
      preprocessCroped(segmentedCanvasCropCtx, segmentedCanvasCrop, widthRoiResult, heightRoiResult)


    }
    // .....

    context += 1;
    requestAnimationFrame(tick);
  }






  const videoSelect = document.querySelector('select#videoSelect');

  videoSelect.onchange = getStream;

  getStream().then(getDevices).then(gotDevices);

  function handleError(error) {
    console.error('Error: ', error);
  }

  function getStream() {
    if (window.stream) {
      window.stream.getTracks().forEach(track => {
        track.stop();
      });
    }
    // const audioSource = audioSelect.value;
    const videoSource = videoSelect.value;
    const constraints = {
      // audio: {deviceId: audioSource ? {exact: audioSource} : undefined},
      video: {
        deviceId: videoSource ? {exact: videoSource} : undefined,
        //width: { max: 500 }
      }

    };
    return navigator.mediaDevices.getUserMedia(constraints).then(gotStream).catch(handleError);
  }


  function getDevices() {
    return navigator.mediaDevices.enumerateDevices();
  }

  function gotDevices(deviceInfos) {
    // console.log(deviceInfos)
    window.deviceInfos = deviceInfos; // make available to console
    // console.log('Available input and output devices:', deviceInfos);
    for (const deviceInfo of deviceInfos) {
      const option = document.createElement('option');
      option.value = deviceInfo.deviceId;
      if (deviceInfo.kind === 'audioinput') {
        // option.text = deviceInfo.label || `Microphone ${audioSelect.length + 1}`;
        // audioSelect.appendChild(option);
      } else if (deviceInfo.kind === 'videoinput') {
        console.log(deviceInfo)
        option.text = deviceInfo.label || `Camera ${videoSelect.length + 1}`;
        videoSelect.appendChild(option);
      }
    }
  }


  function gotStream(stream) {
    window.stream = stream; // make stream available to console
    // audioSelect.selectedIndex = [...audioSelect.options].
    //   findIndex(option => option.text === stream.getAudioTracks()[0].label);
    videoSelect.selectedIndex = [...videoSelect.options].
      findIndex(option => option.text === stream.getVideoTracks()[0].label);
    // videoElement.srcObject = stream
    //track = stream.getVideoTracks()[0];
    
    gmStream.stop()
    
    const change = () => {
      window.setTimeout(() => {
        if (!videoSelect.selectedOptions[0]) change()
        else gmStream.start(videoSelect.selectedOptions[0].value);
      }, 10)
    }

    change()
  }

  tick();
  document.getElementById('canvasWrap').appendChild(canvasProcessed);





  var draging = false;
  //https://stackoverflow.com/questions/55677/how-do-i-get-the-coordinates-of-a-mouse-click-on-a-canvas-element
  function relMouseCoords(event){

    const rect = event.target.getBoundingClientRect()
    const x = event.offsetX || event.layerX
    const y = event.offsetY || event.layerY
    let roiCanvasCtx = roiCanvas.getContext('2d')
    
    if (event.type === 'mousedown' && !draging) {
      draging = true
      selCoord.x0 = x
      selCoord.x1 = x
      selCoord.y0 = y
      selCoord.y1 = y
    }
    
    if ((event.type === 'mousemove') && draging) {
      window.CONF_CHANGING = true
      selCoord.x1 = x
      selCoord.y1 = y

      roiCanvasCtx.clearRect(0,0,roiCanvas.width,roiCanvas.height);
      roiCanvasCtx.fillStyle = '#ffffff00';
      roiCanvasCtx.lineWidth = 1.8;
      roiCanvasCtx.strokeStyle = "#00ff00";
      roiCanvasCtx.strokeRect(selCoord.x0, selCoord.y0, selCoord.x1-selCoord.x0, selCoord.y1-selCoord.y0);
      roiCanvasCtx.fillRect(selCoord.x0, selCoord.y0, selCoord.x1-selCoord.x0, selCoord.y1-selCoord.y0);
      
      
      let segmentedCanvasCropHeight = segmentedCanvasCrop.height
      document.getElementById('ocrResultWrap').style['padding-top'] = `${segmentedCanvasCropHeight}px`
    }
    
    if (event.type === 'mouseup' && draging) {
      console.log(selCoord)
      draging = false
      window.CONF_CHANGING = false
    }
    return {x: x, y: y}
  }


  ;['mousedown', 'mousemove', 'mouseup'].forEach(item => {
    roiCanvas.addEventListener(item, (evt) => relMouseCoords(evt));
  })
  
}
openCamera()
