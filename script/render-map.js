function renderMap({ element, us, cities, selectedCities }) {
  const width = 330;
  const height = 210;
  const circleRadius = 6;
  const ringCircleRadius = 10;

  const usFeature = topojson.feature(us, us.objects.nation);
  const projection = d3.geoAlbersUsa().fitSize([width, height], usFeature);
  const path = d3.geoPath(projection);

  const container = d3.select(element).attr("class", "map");

  const tooltip = renderTooltip(container);

  const svg = container
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const usPath = svg
    .append("path")
    .attr("class", "us-path")
    .attr("d", path(usFeature));

  const cityG = svg
    .append("g")
    .attr("class", "cities-g")
    .selectAll(".city-g")
    .data(cities)
    .join("g")
    .attr("class", "city-g")
    .attr(
      "transform",
      (d) => `translate(${projection([d.longitude, d.latitude])})`
    )
    .on("click", toggle)
    .on("mouseenter", (event, d) => {
      tooltip.show(d.name);
    })
    .on("mousemove", (event) => {
      tooltip.move(...d3.pointer(event, svg.node()));
    })
    .on("mouseleave", () => {
      tooltip.hide();
    });

  cityG
    .append("circle")
    .attr("class", "city-ring-circle")
    .attr("fill", (d) => d.color)
    .attr("r", ringCircleRadius);

  cityG
    .append("circle")
    .attr("class", "city-circle")
    .attr("fill", (d) => d.color)
    .attr("r", circleRadius);

  update({ selectedCities });

  function toggle(event, d) {
    let newlySelectedCities;
    if (selectedCities.includes(d.id)) {
      newlySelectedCities = selectedCities.filter((e) => e !== d.id);
    } else if (selectedCities.length === 4) {
      newlySelectedCities = [...selectedCities.slice(0, 3), d.id];
    } else {
      newlySelectedCities = [...selectedCities, d.id];
    }
    svg.dispatch("selected-cities-change", {
      detail: newlySelectedCities,
      bubbles: true,
    });
  }

  function update({ selectedCities: newlySelectedCities }) {
    if (newlySelectedCities) selectedCities = newlySelectedCities;

    cityG.classed("selected", (d) => selectedCities.includes(d.id));
  }

  return {
    update,
  };
}
