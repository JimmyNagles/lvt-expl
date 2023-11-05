import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css"; // Import the CSS

/*
    blend two colors to create the color that is at the percentage away from the first color
    this is a 5 step process
        1: validate input
        2: convert input to 6 char hex
        3: convert hex to rgb
        4: take the percentage to create a ratio between the two colors
        5: convert blend to hex
    @param: color1      => the first color, hex (ie: #000000)
    @param: color2      => the second color, hex (ie: #ffffff)
    @param: percentage  => the distance from the first color, as a decimal between 0 and 1 (ie: 0.5)
    @returns: string    => the third color, hex, represenatation of the blend between color1 and color2 at the given percentage
*/
function blend_colors(color1, color2, percentage) {
    /*
        convert a Number to a two character hex string
        must round, or we will end up with more digits than expected (2)
        note: can also result in single digit, which will need to be padded with a 0 to the left
        @param: num         => the number to conver to hex
        @returns: string    => the hex representation of the provided number
    */
    function int_to_hex(num)
    {
        var hex = Math.round(num).toString(16);
        if (hex.length == 1)
            hex = '0' + hex;
        return hex;
    }

    // check input
    color1 = color1 || '#000000';
    color2 = color2 || '#ffffff';
    percentage = Math.min(Math.max(percentage || 0.5, 0), 1);

    // 1: validate input, make sure we have provided a valid hex
    if (color1.length != 4 && color1.length != 7)
        throw new Error('colors must be provided as hexes');

    if (color2.length != 4 && color2.length != 7)
        throw new Error('colors must be provided as hexes');

    if (percentage > 1 || percentage < 0)
        throw new Error('percentage must be between 0 and 1');

    // 2: check to see if we need to convert 3 char hex to 6 char hex, else slice off hash
    //      the three character hex is just a representation of the 6 hex where each character is repeated
    //      ie: #060 => #006600 (green)
    if (color1.length == 4)
        color1 = color1[1] + color1[1] + color1[2] + color1[2] + color1[3] + color1[3];
    else
        color1 = color1.substring(1);
    if (color2.length == 4)
        color2 = color2[1] + color2[1] + color2[2] + color2[2] + color2[3] + color2[3];
    else
        color2 = color2.substring(1);

    // 3: we have valid input, convert colors to rgb
    color1 = [parseInt(color1[0] + color1[1], 16), parseInt(color1[2] + color1[3], 16), parseInt(color1[4] + color1[5], 16)];
    color2 = [parseInt(color2[0] + color2[1], 16), parseInt(color2[2] + color2[3], 16), parseInt(color2[4] + color2[5], 16)];

    // 4: blend
    var color3 = [
        (1 - percentage) * color1[0] + percentage * color2[0],
        (1 - percentage) * color1[1] + percentage * color2[1],
        (1 - percentage) * color1[2] + percentage * color2[2]
    ];

    // 5: convert to hex
    color3 = '#' + int_to_hex(color3[0]) + int_to_hex(color3[1]) + int_to_hex(color3[2]);

    // return hex
    return color3;
}

mapboxgl.accessToken =
  "pk.eyJ1IjoiamltbXk5NiIsImEiOiJja3k1NTd6cjYwaWd2Mm5wdm9ydndtbmY2In0.I8ineDR8DIBU-Igc6eUVig"; // Your Mapbox access token

const maxArea = 58001446;

const Mapbox = () => {
  const mapContainerRef = useRef(null);
  const hoveredFeatureId = useRef(null); // Use useRef here
  const [geojsonData, setGeojsonData] = useState(null);

  const [propTaxFactor, setPropTaxFactor] = useState(0.9);
  const [areaTaxFactor, setAreaTaxFactor] = useState(0.1);

  const classifyData = (data) => {
    let minDifference = Infinity;
    let maxDifference = -Infinity;
    data.features.forEach((feature) => {
      if (!feature.properties.property_value || !feature.properties.lot_area) {
        return;
      }
      const originalTax = feature.properties.property_value * 0.01177;
      const proposedTax = feature.properties.property_value * 0.01177 * propTaxFactor + feature.properties.lot_area * areaTaxFactor;
      const difference = proposedTax - originalTax;
      feature.properties.tax_difference = difference;
      minDifference = difference < minDifference ? difference : minDifference;
      maxDifference = difference > maxDifference ? difference : maxDifference;
    });
    console.log(minDifference);
    console.log(maxDifference);
    const largestDifference = Math.max(Math.abs(minDifference), Math.abs(maxDifference));
    data.features.forEach((feature) => {
      if (!feature.properties.tax_difference || !feature.properties.lot_area) {
        return;
      }
      // Example classification: Add a 'color' property based on 'zoning_code'
      //const targetBlend = Math.log(feature.properties.tax_difference) / Math.log(maxDifference + 1);
      const targetBlend = (feature.properties.tax_difference + largestDifference) / (largestDifference * 2);
      if (targetBlend > 0.5) {
        feature.properties.color = blend_colors('#00ffff', '#ff00ff', targetBlend * 2 - 1);
      } else {
        feature.properties.color = blend_colors('#00ff00', '#0000ff', targetBlend * 2);
      }
    });
    data.features = data.features.filter(feature => feature.properties.tax_difference !== undefined);
    return data;
  };

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [-122.4194, 37.7749],
      zoom: 12,
    });

    map.on("load", () => {
      fetch("/all.geojson")
        .then((response) => response.json())
        .then((data) => {
          // Ensure each feature has a unique `id`
          const classifiedData = classifyData(data);
          setGeojsonData(classifiedData);

          data.features.forEach((feature, index) => {
            if (!feature.id) {
              feature.id = index.toString(); // Assigning a unique ID to each feature if it doesn't have one
            }
          });

          // Add the processed data as a source to the map
          map.addSource("boundaries", {
            type: "geojson",
            data: data,
          });

          map.addLayer({
            id: "plot-boundary",
            type: "fill",
            source: "boundaries",
            paint: {
              "fill-color": [
                "case",
                ["boolean", ["feature-state", "hover"], false],
                "#FF0000", // Color when hovered
                ["get", "color"], // Use the 'color' property from the feature's properties object
              ],
              "fill-opacity": 0.4,
            },
            filter: ["==", "$type", "Polygon"],
          });

          const popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false,
          });

          map.on("mouseenter", "plot-boundary", (e) => {
            map.getCanvas().style.cursor = "pointer";
            if (hoveredFeatureId.current) {
              map.setFeatureState(
                { source: "boundaries", id: hoveredFeatureId.current },
                { hover: false }
              );
            }
            hoveredFeatureId.current = e.features[0].id;
            map.setFeatureState(
              { source: "boundaries", id: hoveredFeatureId.current },
              { hover: true }
            );

            const coordinates = e.lngLat;
            const properties = e.features[0].properties;

            // Extract and format the desired properties
            const description = `
    <strong>Plot Name:</strong> ${properties.name || "N/A"}<br>
    <strong>Zoning Code:</strong> ${properties.zoning_code || "N/A"}<br>
    <strong>Zoning District:</strong> ${properties.zoning_district || "N/A"}<br>
    <strong>Block Number:</strong> ${properties.block_num || "N/A"}<br>
    <strong>Lot Number:</strong> ${properties.lot_num || "N/A"}<br>
    <strong>2022 Total Assessed Property Value:</strong> $${properties.property_value || "N/A"}<br>
    <strong>Tax Difference:</strong> $${Math.floor(properties.tax_difference) || "N/A"}<br>
`;

            popup.setLngLat(coordinates).setHTML(description).addTo(map);
          });

          map.on("mouseleave", "plot-boundary", () => {
            map.getCanvas().style.cursor = "";
            if (hoveredFeatureId.current) {
              map.setFeatureState(
                { source: "boundaries", id: hoveredFeatureId.current },
                { hover: false }
              );
              hoveredFeatureId.current = null;
            }
            popup.remove();
          });
        })
        .catch((error) => {
          console.error("Error fetching GeoJSON data:", error);
        });
    });

    return () => map.remove();
  }, []);

  return (
    <div ref={mapContainerRef} style={{ width: "100vw", height: "100vh" }} />
  );
};

export default Mapbox;
