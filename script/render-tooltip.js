function renderTooltip(container) {
  const tooltip = container
    .classed("tooltip-container", true)
    .append("div")
    .attr("class", "tooltip");

  function show(html) {
    tooltip.html(html).classed("active", true);
  }

  function hide() {
    tooltip.classed("active", false);
  }

  function move(x, y) {
    const translateX = `calc(${x}px - 50%)`;
    const translateY = `calc(${y}px - 100% - 8px)`;
    tooltip.style("transform", `translate(${translateX},${translateY})`);
  }

  return {
    show,
    hide,
    move,
  };
}
