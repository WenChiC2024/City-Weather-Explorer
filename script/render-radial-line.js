function renderRadialLine({
  element,
  variableName,
  valueAccessor,
  cities,
  selectedCities,
  selectedDateIndexExtent,
}) {
  const width = 640;
  const height = 640;
  const margin = 15;
  const outerRadius = width / 2 - margin;
  const innerRadius = outerRadius * 0.3;
  const radius = 4;

  const x = d3
    .scaleTime()
    .domain([new Date(2000, 0, 1), new Date(2001, 0, 1) - 1])
    .range([0, 2 * Math.PI]);

  const y = d3.scaleLinear().range([innerRadius, outerRadius]);

  const line = d3
    .lineRadial()
    .curve(d3.curveLinear)
    .angle((d) => x(d.date))
    .radius((d) => y(valueAccessor(d)));

  const container = d3.select(element).classed("radial-line", true);

  const tooltip = renderTooltip(container);

  const svg = container
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const g = svg
    .append("g")
    .attr("transform", `translate(${width / 2},${height / 2})`);

  g.append("text")
    .attr("class", "variable-name")
    .attr("dy", "0.32em")
    .attr("text-anchor", "middle")
    .text(variableName);

  const linesG = g.append("g").attr("fill", "none");

  const activeCirclesG = g.append("g");

  const xAxisG = g.append("g").attr("class", "axis");

  const xTickG = xAxisG
    .selectAll(".tick")
    .data(x.ticks())
    .join("g")
    .attr("class", "tick")
    .attr("transform", (d) => `rotate(${(x(d) / Math.PI) * 180 - 90})`);

  xTickG
    .append("line")
    .attr("stroke", "currentColor")
    .attr("x1", innerRadius - 6)
    .attr("x2", outerRadius);

  xTickG
    .append("text")
    .attr("fill", "currentColor")
    .attr("text-anchor", "middle")
    .attr("x", innerRadius - 9)
    .attr("dy", "0.71em")
    .attr("transform", (d) => `rotate(90,${innerRadius - 9},0)`)
    .text((d) => d3.timeFormat("%b")(d));

  const yAxisG = g.append("g").attr("class", "axis");

  update({ selectedCities, selectedDateIndexExtent });

  function update({
    selectedCities: newlySelectedCities,
    selectedDateIndexExtent: newlySelectedDateIndexExtent,
  }) {
    if (newlySelectedCities !== undefined) selectedCities = newlySelectedCities;
    if (newlySelectedDateIndexExtent !== undefined)
      selectedDateIndexExtent = newlySelectedDateIndexExtent;

    const filtered = selectedCities.map((d) => cities.find((e) => e.id === d));

    y.domain([
      d3.min(filtered, (d) =>
        d3.min(
          d.data.slice(
            selectedDateIndexExtent[0],
            selectedDateIndexExtent[1] + 1
          ),
          valueAccessor
        )
      ),
      d3.max(filtered, (d) =>
        d3.max(
          d.data.slice(
            selectedDateIndexExtent[0],
            selectedDateIndexExtent[1] + 1
          ),
          valueAccessor
        )
      ),
    ]).nice();

    const dates = cities[0].data
      .slice(selectedDateIndexExtent[0], selectedDateIndexExtent[1] + 1)
      .map((d) => d.date);

    let iActive = null;
    let delaunay;

    svg
      .on("mousemove", (event) => {
        if (!delaunay) {
          const pointsInPolar = d3
            .merge(
              filtered.map((d) =>
                d.data.slice(
                  selectedDateIndexExtent[0],
                  selectedDateIndexExtent[1] + 1
                )
              )
            )
            .map((d) => ({
              theta: x(d.date),
              r: y(valueAccessor(d)),
            }));

          const pointsInCartesian = pointsInPolar.map((d) => ({
            x: d.r * Math.cos(d.theta - Math.PI / 2),
            y: d.r * Math.sin(d.theta - Math.PI / 2),
          }));

          delaunay = d3.Delaunay.from(
            pointsInCartesian,
            (d) => d.x,
            (d) => d.y
          );
        }
        const i =
          delaunay.find(...d3.pointer(event, g.node()), iActive || 0) %
          dates.length;
        if (iActive !== i) {
          iActive = i;
          activeCircle.attr("display", null).each(function (d) {
            const theta = x(
              d.data.slice(
                selectedDateIndexExtent[0],
                selectedDateIndexExtent[1] + 1
              )[i].date
            );
            const r = y(
              valueAccessor(
                d.data.slice(
                  selectedDateIndexExtent[0],
                  selectedDateIndexExtent[1] + 1
                )[i]
              )
            );
            d3.select(this)
              .attr("cx", r * Math.cos(theta - Math.PI / 2))
              .attr("cy", r * Math.sin(theta - Math.PI / 2));
          });
          tooltip.show(`
          <div>${variableName}</div>
          <div><span class="tooltip-value">${d3.timeFormat("%b %-d, %Y")(
            dates[iActive]
          )}</span></div>
          ${filtered
            .map(
              (d) =>
                `<div><span style="color: ${d.color}">${
                  d.name
                }</span>: <span class="tooltip-value">${valueAccessor(
                  d.data[i]
                )}</span></div>`
            )
            .join("")}
          `);
          tooltip.move(...d3.pointer(event, container.node()));
        }
      })
      .on("mouseleave", () => {
        iActive = null;
        activeCircle.attr("display", "none");
        tooltip.hide();
      });

    linesG
      .selectAll(".line-path")
      .data(filtered, (d) => d.id)
      .join("path")
      .attr("class", "line-path")
      .attr("stroke", (d) => d.color)
      .attr("d", (d) =>
        line(
          d.data.slice(
            selectedDateIndexExtent[0],
            selectedDateIndexExtent[1] + 1
          )
        )
      );

    const activeCircle = activeCirclesG
      .selectAll(".active-circle")
      .data(filtered, (d) => d.id)
      .join("circle")
      .attr("class", "active-circle")
      .attr("display", "none")
      .attr("fill", (d) => d.color)
      .attr("r", radius);

    yAxisG.selectAll("*").remove();

    const yTickG = yAxisG
      .selectAll(".tick")
      .data(y.ticks(4))
      .join("g")
      .attr("class", "tick");

    yTickG
      .append("circle")
      .attr("fill", "none")
      .attr("stroke", "currentColor")
      .attr("r", (d) => y(d));

    yTickG
      .append("text")
      .attr("text-anchor", "middle")
      .attr("stroke", "#fff")
      .attr("stroke-width", 3)
      .attr("y", (d) => -y(d) - 3)
      .text((d) => d);

    yTickG
      .append("text")
      .attr("text-anchor", "middle")
      .attr("fill", "currentColor")
      .attr("y", (d) => -y(d) - 3)
      .text((d) => d);
  }

  return { update };
}
