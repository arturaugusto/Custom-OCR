let wp = new WorkersPool(dbscan)

function clusterize(canvasProcessed, eps, min_points) {
  return new Promise((resolve, reject) => {
    let ctx = canvasProcessed.getContext('2d')
    let canvasProcessedImageData = ctx.getImageData(0, 0, canvasProcessed.width, canvasProcessed.height)
    
    let xyObjectArray = toXYObjectArray(canvasProcessedImageData.data, canvasProcessed.width, 4)
    
    let points = xyObjectArray.filter(p => p.val)
    
    let pointsYXArray = points.map(p => [p.y, p.x])

    let payload = {
      eps: eps,
      min_points: min_points,
      inputs: pointsYXArray,
    }
    
    wp.run([[payload]]).then(results => {
      let result = results[0]
      
      points.forEach((p, i) => {
        p.cluster = result[i]
      })

      // group by cluster
      let groups = points.filter(p => p.cluster >= 0).reduce((a, c) => {
        a[c.cluster] = a[c.cluster] || {points: []}
        a[c.cluster].points.push(c)
        return a
      }, {})


      // set groups x and y
      let groupsArray = Object.keys(groups).map(groupKey => {
        let group = groups[groupKey]

        let x0 = Infinity
        let x1 = 0

        let y0 = Infinity
        let y1 = 0

        for (let i = group.points.length - 1; i >= 0; i--) {
          let p = group.points[i];
          if (p.x > x1) x1 = p.x
          if (p.x < x0) x0 = p.x
          if (p.y > y1) y1 = p.y
          if (p.y < y0) y0 = p.y
        }

        group.y0 = y0
        group.y1 = y1
        
        group.x0 = x0
        group.x1 = x1

        return group
      })
      .sort((a, b) => a.x0 - b.x0)

      // return groupsArray
      return resolve(groupsArray)
    }).catch(err => {
      wp.terminate()
      throw 'dbscan error'
    })
  })


}
