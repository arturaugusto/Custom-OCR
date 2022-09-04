function ocr(weights) {
  let ocrResult = weights.map((weight) => {
    return window.TRAINED_DATA.map(trainedWeight => {
      let score = trainedWeight.data.reduce((a, _, i) => {

        if (trainedWeight.isPunctuation !== weight.isPunctuation) return a
        if (trainedWeight.isThin !== weight.isThin) return a
        
        let t = trainedWeight.data[i]
        let c = weight.data[i % weight.data.length]
        
        a += c === t ? 1 : 0
        
        return a
      }, 0) / trainedWeight.data.length
      // score += Math.abs(weight.aspectRatio - trainedWeight.aspectRatio)
      // console.log(Math.abs(weight.aspectRatio - trainedWeight.aspectRatio))
      // score += Math.abs(weight.widthNorm - trainedWeight.widthNorm)
      // score += Math.abs(weight.heigthNorm - trainedWeight.heigthNorm)

      return {
        score: score,
        char: trainedWeight.char
      }
    })
    // .sort((a, b) => a.score-b.score) // do menor para o maior
    .sort((a, b) => b.score-a.score) // do maior para o menor
  })

  let boxes = ocrResult.map(results => {
    return {
      best: results[0],
      options: results.slice(1),
      relativeScore: Math.round((results[0].score-results[1].score)*100)/100,
      char: results[0].char,
      score: results[0].score
    }
  })
  let res = {
    score: boxes.reduce((a, c) => a+c.score, 0)/boxes.length,
    relativeScore: boxes.reduce((a, c) => a+c.relativeScore, 0)/boxes.length,
    text: boxes.map(b => b.char).join(''),
    boxes: boxes
  }
  // console.log(ocrResult.map(item => item[0]))
  return res
}