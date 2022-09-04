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

  // session uses a context for optimize calculations and prevent recalculations
  // context actually a number which help algorythm to run operation efficiently  
  let context = 0;
  // allocate memeory for storing a frame and calculations output
  let input
  // construct operation grap which is actially a Canny Edge Detector
  
  let sess 
  let pipeline
  let output

  //////////////////////////////////////////
  const setPipeline = () => {
    sess = new gm.Session();
    input = new gm.Tensor('uint8', [height, width, 4]);
    pipeline = input
    
    if (document.getElementById('noiseReduction').checked) {
      pipeline = gm.norm(pipeline, 'l2') //l2, minmax
    }
    
    pipeline = gm.grayscale(pipeline);
    
    if (document.getElementById('blur').checked) {
      pipeline = gm.gaussianBlur(pipeline, 3, 3);
    }
    
    pipeline = gm.adaptiveThreshold(pipeline, parseFloat(document.getElementById('threshold').value), 0);

    if (document.getElementById('invert').checked) {
      const whiteTensor = new gm.Tensor('uint8', [height, width, 4]);
      whiteTensor.data.fill(255);
      pipeline = gm.sub(whiteTensor, pipeline);
    }

    // pipeline = gm.sobelOperator(pipeline);
    // pipeline = gm.cannyEdges(pipeline, 0.25, 0.75);
    
    if (document.getElementById('dilate').checked) {
      pipeline = gm.dilate(pipeline, [1, 3]);
    }
    
    if (document.getElementById('erode').checked) {
      pipeline = gm.erode(pipeline, [1, 3]);
    }

    // initialize graph
    sess.init(pipeline);

    // allocate output
    // const output = gm.tensorFrom(pipeline);
    output = gm.tensorFrom(pipeline);
  }
  //////////////////////////////////////////
  setPipeline()

  ;['threshold', 'invert', 'blur','dilate','erode', 'noiseReduction'].forEach(op => {
    document.getElementById(op).addEventListener('change', () => {
      sess.destroy()
      setPipeline()
    })
  })



  let selCoord = {x0: 121, y0: 122, x1: 330, y1: 187}

  // create loop
  const tick = () => {
    document.getElementById('canvasWrap').style.height = `${canvasProcessed.clientHeight+20}px`
        
    let roiNorm = [
      Math.min(selCoord.x0, selCoord.x1),
      Math.min(selCoord.y0, selCoord.y1),
      Math.max(selCoord.x0, selCoord.x1),
      Math.max(selCoord.y0, selCoord.y1)
    ]
    segmentedCanvas.width = roiNorm[2] - roiNorm[0]
    segmentedCanvas.height = roiNorm[3] - roiNorm[1]
    segmentedCanvasCtx.clearRect(0,0,segmentedCanvas.width,segmentedCanvas.height)

    segmentedCanvasCtx.drawImage(canvasProcessed, 
      roiNorm[0], roiNorm[1], roiNorm[2] - roiNorm[0], roiNorm[3] - roiNorm[1],
      0, 0, (roiNorm[2] - roiNorm[0]), (roiNorm[3] - roiNorm[1])
    )

    if (segmentedCanvas.width * segmentedCanvas.height > 10) {}
    

    // Read current in to the tensor
    gmStream.getImageBuffer(input);

    // finaly run operation on GPU and then write result in to output tensor
    sess.runOp(pipeline, context, output);

    // draw result into canvas
    gm.canvasFromTensor(canvasProcessed, output);


    // if we would like to be graph recalculated we need 
    // to change the context for next frame
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
    if (event.type === 'mousedown' && !draging) {
      draging = true
      selCoord.x0 = x
      selCoord.x1 = x
      selCoord.y0 = y
      selCoord.y1 = y
    }
    if ((event.type === 'mousemove') && draging) {
      selCoord.x1 = x
      selCoord.y1 = y

      let roiCanvasCtx = roiCanvas.getContext('2d')
      roiCanvasCtx.clearRect(0,0,roiCanvas.width,roiCanvas.height)
      roiCanvasCtx.fillStyle = '#ffffff77';
      roiCanvasCtx.fillRect(selCoord.x0, selCoord.y0, selCoord.x1-selCoord.x0, selCoord.y1-selCoord.y0);
    }
    
    if (event.type === 'mouseup' && draging) {
      console.log(selCoord)
      draging = false
    }
    return {x: x, y: y}
  }


  ;['mousedown', 'mousemove', 'mouseup'].forEach(item => {
    roiCanvas.addEventListener(item, (evt) => relMouseCoords(evt));
  })
  
}
openCamera()
