function drawBoxes(groupsArray, ctx) {
  // ctx.fillStyle = "#00FF0000";
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = "#00FF00";
  groupsArray.forEach(group => {
    ctx.rect(group.x0, group.y0, group.x1-group.x0, group.y1-group.y0);
    // ctx.fill();
  })
  ctx.stroke();
}