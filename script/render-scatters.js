function renderScatters({
  element,
  cities,
  selectedCities,
  selectedDateIndexExtent,
}) {
  const width = 210;
  const height = 200;
  const margin = {
    top: 20,
    right: 10,
    bottom: 35,
    left: 52,
  };
  const radius = 4;

  const x = d3.scaleLinear().range([margin.left, width - margin.right]);
  const y = d3.scaleLinear().range([height - margin.bottom, margin.top]);

  const container = d3.select(element).classed("scatters", true);

  update({ selectedCities, selectedDateIndexExtent });

  let iActive = null;

  function renderScatter(cityContainer) {
    cityContainer.each(function (d) {
      let delaunay;

      const container = d3.select(this);

      this.tooltip = renderTooltip(container);

      const svg = container
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .on("mousemove", (event) => {
          if (!delaunay) {
            delaunay = d3.Delaunay.from(
              d.data.slice(
                selectedDateIndexExtent[0],
                selectedDateIndexExtent[1] + 1
              ),
              (d) => x(d.actualMeanTemp),
              (d) => y(d.actualPrecipitation)
            );
          }
          const i = delaunay.find(
            ...d3.pointer(event, svg.node()),
            iActive || 0
          );
          if (iActive !== i) {
            iActive = i;
            cityContainer.each(function (d) {
              const active = d.data.slice(
                selectedDateIndexExtent[0],
                selectedDateIndexExtent[1] + 1
              )[iActive];
              this.activeCircle
                .attr("display", null)
                .attr("cx", x(active.actualMeanTemp))
                .attr("cy", y(active.actualPrecipitation));
              this.tooltip.show(`
                <div><span class="tooltip-value" style="color: ${
                  d.color
                }">${d.name}</span></div>
                <div><span class="tooltip-value">${d3.timeFormat("%b %-d, %Y")(
                  active.date
                )}</span></div>
                <div>Temperature: <span class="tooltip-value">${
                  active.actualMeanTemp
                }</span></div>
                <div>Precipitation: <span class="tooltip-value">${
                  active.actualPrecipitation
                }</span></div>
              `);
              this.tooltip.move(
                x(active.actualMeanTemp),
                y(active.actualPrecipitation)
              );
            });
          }
        })
        .on("mouseleave", () => {
          iActive = null;
          cityContainer.each(function (d) {
            this.activeCircle.attr("display", "none");
            this.tooltip.hide();
          });
        });

      svg
        .append("text")
        .attr("class", "city-name")
        .attr("fill", d.color)
        .attr("y", margin.top - 8)
        .text(d.name.split(", ")[0]);

      const xAxisG = svg
        .append("g")
        .attr("class", "axis")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(5).tickSizeOuter(0));

      xAxisG
        .append("text")
        .attr("class", "axis-title")
        .attr("fill", "currentColor")
        .attr("text-anchor", "middle")
        .attr(
          "transform",
          `translate(${(margin.left + width - margin.right) / 2},${
            margin.bottom - 4
          })`
        )
        .text("Temperature");

      const yAxisG = svg
        .append("g")
        .attr("class", "axis")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(5).tickSizeOuter(0));

      yAxisG
        .append("text")
        .attr("class", "axis-title")
        .attr("fill", "currentColor")
        .attr("text-anchor", "middle")
        .attr("dy", "0.71em")
        .attr(
          "transform",
          `translate(${-margin.left + 4},${
            (margin.top + height - margin.bottom) / 2
          })rotate(-90)`
        )
        .text("Precipitation");

      const circle = svg
        .append("g")
        .selectAll(".circle")
        .data((d) =>
          d.data.slice(
            selectedDateIndexExtent[0],
            selectedDateIndexExtent[1] + 1
          )
        )
        .join("circle")
        .attr("class", "circle")
        .attr("fill", d.color)
        .attr("r", radius)
        .attr("cx", (d) => x(d.actualMeanTemp))
        .attr("cy", (d) => y(d.actualPrecipitation));

      this.activeCircle = svg
        .append("circle")
        .attr("class", "active-circle")
        .attr("fill", d.color)
        .attr("r", radius)
        .attr("display", "none");
    });
  }

  function update({
    selectedCities: newlySelectedCities,
    selectedDateIndexExtent: newlySelectedDateIndexExtent,
  }) {
    if (newlySelectedCities !== undefined) selectedCities = newlySelectedCities;
    if (newlySelectedDateIndexExtent !== undefined)
      selectedDateIndexExtent = newlySelectedDateIndexExtent;

    const filtered = selectedCities.map((d) => cities.find((e) => e.id === d));

    x.domain([
      d3.min(filtered, (d) =>
        d3.min(
          d.data.slice(
            selectedDateIndexExtent[0],
            selectedDateIndexExtent[1] + 1
          ),
          (e) => e.actualMeanTemp
        )
      ),
      d3.max(filtered, (d) =>
        d3.max(
          d.data.slice(
            selectedDateIndexExtent[0],
            selectedDateIndexExtent[1] + 1
          ),
          (e) => e.actualMeanTemp
        )
      ),
    ]).nice();

    y.domain([
      d3.min(filtered, (d) =>
        d3.min(
          d.data.slice(
            selectedDateIndexExtent[0],
            selectedDateIndexExtent[1] + 1
          ),
          (e) => e.actualPrecipitation
        )
      ),
      d3.max(filtered, (d) =>
        d3.max(
          d.data.slice(
            selectedDateIndexExtent[0],
            selectedDateIndexExtent[1] + 1
          ),
          (e) => e.actualPrecipitation
        )
      ),
    ]).nice();

    container.selectAll("*").remove();

    const cityContainer = container
      .selectAll(".city-container")
      .data(filtered, (d) => d.id)
      .join("div")
      .attr("class", "city-container")
      .call(renderScatter);
  }

  return { update };
}
