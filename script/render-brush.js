function renderBrush({ element, dates, selectedDateIndexExtent }) {
  const width = 1400;
  const height = 50;
  const margin = {
    top: 1,
    right: 200,
    bottom: 25,
    left: 200,
  };

  const x = d3
    .scaleLinear()
    .domain([0, dates.length - 1])
    .range([margin.left, width - margin.right]);

  const xTime = d3
    .scaleTime()
    .domain([dates[0], dates[dates.length - 1]])
    .range([margin.left, width - margin.right]);

  const brush = d3
    .brushX()
    .extent([
      [margin.left, margin.top],
      [width - margin.right, height - margin.bottom],
    ])
    .on("brush", brushed);

  const formatDateLabel = d3.timeFormat("%b %-d, %Y");

  const container = d3.select(element).classed("date-brush", true);

  const svg = container
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const xAxisG = svg
    .append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(d3.axisBottom(xTime).tickSizeOuter(0));

  const selectedDateLabel = svg
    .append("g")
    .selectAll(".date-label")
    .data([
      { textAnchor: "end", dx: -6 },
      { textAnchor: "start", dx: 6 },
    ])
    .join("text")
    .attr("class", "date-label")
    .attr("fill", "currentColor")
    .attr("y", (margin.top + height - margin.bottom) / 2)
    .attr("dx", (d) => d.dx)
    .attr("dy", "0.32em")
    .attr("text-anchor", (d) => d.textAnchor)
    .attr("x", (d, i) => x(selectedDateIndexExtent[i]))
    .text((d, i) => formatDateLabel(dates[selectedDateIndexExtent[i]]));

  const brushG = svg
    .append("g")
    .attr("class", "brush-g")
    .call(brush)
    .call(brush.move, selectedDateIndexExtent.map(x));

  function brushed(event) {
    if (!event.sourceEvent) return;
    const d0 = event.selection.map(x.invert);
    const d1 = d0.map(Math.round);

    // If empty when rounded, use floor instead.
    if (d1[0] === dates.length - 1) {
      d1[0] = dates.length - 2;
      d1[1] = dates.length - 1;
    } else if (d1[0] >= d1[1]) {
      d1[0] = Math.floor(d0[0]);
      d1[1] = Math.floor(d1[0]) + 1;
    }

    selectedDateLabel
      .attr("x", (d, i) => x(d1[i]))
      .text((d, i) => formatDateLabel(dates[d1[i]]));

    d3.select(this).call(brush.move, d1.map(x));

    if (
      d1[0] !== selectedDateIndexExtent[0] ||
      d1[1] !== selectedDateIndexExtent[1]
    ) {
      selectedDateIndexExtent = d1;
      container.dispatch("selected-date-index-extent-change", {
        detail: d1,
        bubbles: true,
      });
    }
  }
}
