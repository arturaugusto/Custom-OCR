////////////////////////////////////////////
// otsu
////////////////////////////////////////////

var RED_INTENCITY_COEF = 0.2126;
var GREEN_INTENCITY_COEF = 0.7152;
var BLUE_INTENCITY_COEF = 0.0722;

function toGrayscale(context, w, h) {
    var imageData = context.getImageData(0, 0, w, h);
    var data = imageData.data;
    
    for(var i = 0; i < data.length; i += 4) {
        var brightness = RED_INTENCITY_COEF * data[i] + GREEN_INTENCITY_COEF * data[i + 1] + BLUE_INTENCITY_COEF * data[i + 2];
        // red
        data[i] = brightness;
        // green
        data[i + 1] = brightness;
        // blue
        data[i + 2] = brightness;
    }
    
    // overwrite original image
    context.putImageData(imageData, 0, 0);
};

function hist(context, w, h) {
    var imageData = context.getImageData(0, 0, w, h);
    var data = imageData.data;
    var brightness;
    var brightness256Val;
    var histArray = Array.apply(null, new Array(256)).map(Number.prototype.valueOf,0);
    
    for (var i = 0; i < data.length; i += 4) {
        brightness = RED_INTENCITY_COEF * data[i] + GREEN_INTENCITY_COEF * data[i + 1] + BLUE_INTENCITY_COEF * data[i + 2];
        brightness256Val = Math.floor(brightness);
        histArray[brightness256Val] += 1;
    }
    
    return histArray;
};

function otsu(histogram, total) {
    var sum = 0;
    for (var i = 1; i < 256; ++i)
        sum += i * histogram[i];
    var sumB = 0;
    var wB = 0;
    var wF = 0;
    var mB;
    var mF;
    var max = 0.0;
    var between = 0.0;
    var threshold1 = 0.0;
    var threshold2 = 0.0;
    for (var i = 0; i < 256; ++i) {
        wB += histogram[i];
        if (wB == 0)
            continue;
        wF = total - wB;
        if (wF == 0)
            break;
        sumB += i * histogram[i];
        mB = sumB / wB;
        mF = (sum - sumB) / wF;
        between = wB * wF * Math.pow(mB - mF, 2);
        if ( between >= max ) {
            threshold1 = i;
            if ( between > max ) {
                threshold2 = i;
            }
            max = between;            
        }
    }
    return ( threshold1 + threshold2 ) / 2.0;
};

function binarize(threshold, context, w, h) {
    var imageData = context.getImageData(0, 0, w, h);
    var data = imageData.data;
    var val;
    
    for(var i = 0; i < data.length; i += 4) {
        var brightness = RED_INTENCITY_COEF * data[i] + GREEN_INTENCITY_COEF * data[i + 1] + BLUE_INTENCITY_COEF * data[i + 2];
        // if (document.getElementById('invert').checked) {
        //   val = ((brightness > threshold) ? 0 : 255);
        // } else {
        //   val = ((brightness > threshold) ? 255 : 0);
        // }
        val = ((brightness > threshold) ? 255 : 0);
        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
    }
    
    // overwrite original image
    context.putImageData(imageData, 0, 0);
}

const preprocessCroped = function(ctx, canvas, w, h) {
  toGrayscale(ctx, w, h);

  var gamma = parseFloat(document.getElementById('gamma').value)/10;
  var gammaCorrection = 1 / gamma;

  var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  function GetPixelColor(x, y) {   
      var index = parseInt(x + canvas.width * y) * 4;
      var rgb = {
          r : imageData.data[index + 0],
          g : imageData.data[index + 1],
          b : imageData.data[index + 2]
      };
      return rgb;
  }

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      var color = GetPixelColor(x, y)
      var newRed   = 255 * Math.pow((color.r / 255), gammaCorrection);
      var newGreen = 255 * Math.pow((color.g / 255), gammaCorrection);
      var newBlue  = 255 * Math.pow((color.b / 255), gammaCorrection);

      var color = {
        r: newRed,
        g: newGreen,
        b: newBlue
      }

      var index = parseInt(x + canvas.width * y) * 4;
      var data = imageData.data;
      
      data[index+0] = color.r;
      data[index+1] = color.g;
      data[index+2] = color.b;
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
  var histogram = hist(ctx, w, h);
  var threshold = otsu(histogram, w*h);
  binarize(threshold, ctx, w, h);
}