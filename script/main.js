const cities = [
  {
    id: "CLT",
    name: "Charlotte, North Carolina",
    color: "#11b5ae",
  },
  {
    id: "CQT",
    name: "Los Angeles, California",
    color: "#4046ca",
  },
  {
    id: "IND",
    name: "Indianapolis, Indiana",
    color: "#f68512",
  },
  {
    id: "JAX",
    name: "Jacksonville, Florida",
    color: "#de3c82",
  },
  {
    id: "MDW",
    name: "Chicago, Illinois",
    color: "#7e84fa",
  },
  {
    id: "PHL",
    name: "Philadelphia, Pennsylvania",
    color: "#72e06a",
  },
  {
    id: "PHX",
    name: "Pheonix, Arizona",
    color: "#167af3",
  },
  {
    id: "KHOU",
    name: "Houston, Texas",
    color: "#7326d3",
  },
  {
    id: "KNYC",
    name: "New York, New York",
    color: "#e8c600",
  },
  {
    id: "KSEA",
    name: "Seattle, Washington",
    color: "#cb5d02",
  },
];

Promise.all([
  d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/nation-10m.json"),
  d3.csv("data/cities-gps.csv"),
  ...cities.map((d) => d3.csv(`data/${d.id}.csv`)),
]).then(([us, citiesGPS, ...citiesData]) => {
  cities.forEach((d) => {
    const e = citiesGPS.find((e) => e["City Name ABR"] === d.id);
    d.latitude = +e["Lat"];
    d.longitude = +e["Long"];
  });

  const parseDate = d3.timeParse("%Y-%-m-%-d");
  citiesData.forEach((data, i) => {
    cities[i].data = data.map((d) => ({
      date: parseDate(d.date),
      actualMeanTemp: +d.actual_mean_temp,
      actualPrecipitation: +d.actual_precipitation,
    }));
  });

  const dates = cities[0].data.map((d) => d.date);

  let selectedCities = ["CQT", "JAX", "KNYC"];
  let selectedDateIndexExtent = [0, dates.length - 1];

  const map = renderMap({
    element: "#map",
    us,
    cities,
    selectedCities,
  });

  const brush = renderBrush({
    element: "#dateBrush",
    dates,
    selectedDateIndexExtent,
  });

  const scatters = renderScatters({
    element: "#temperaturePrecipitationScatters",
    cities,
    selectedCities,
    selectedDateIndexExtent,
  });

  const tempRadialLine = renderRadialLine({
    element: "#temperatureRadialLine",
    variableName: "Temperature",
    valueAccessor: (d) => d.actualMeanTemp,
    cities,
    selectedCities,
    selectedDateIndexExtent,
  });

  const precipitationRadialLine = renderRadialLine({
    element: "#precipitationRadialLine",
    variableName: "Precipitation",
    valueAccessor: (d) => d.actualPrecipitation,
    cities,
    selectedCities,
    selectedDateIndexExtent,
  });

  d3.select("body")
    .on("selected-cities-change", (event) => {
      selectedCities = event.detail;
      map.update({ selectedCities });
      scatters.update({ selectedCities });
      tempRadialLine.update({ selectedCities });
      precipitationRadialLine.update({ selectedCities });
    })
    .on("selected-date-index-extent-change", (event) => {
      selectedDateIndexExtent = event.detail;
      scatters.update({ selectedDateIndexExtent });
      tempRadialLine.update({ selectedDateIndexExtent });
      precipitationRadialLine.update({ selectedDateIndexExtent });
    });
});
