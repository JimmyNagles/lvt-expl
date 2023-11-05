import { useRouter } from "next/router";
import { useState, useEffect } from "react";

const Property = () => {
  const router = useRouter();
  const { id } = router.query;

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetch("/all.geojson")
        .then((response) => response.json())
        .then((data) => {
          const propertyDetails = data.features.find(
            (feature) => feature.properties.blklot === id
          );
          setProperty(propertyDetails);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching property details:", error);
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!property) {
    return <div>Property not found.</div>;
  }

  return (
    <div className="p-20">
      <button onClick={() => router.back()}>Back to Map</button>

      <div className="grid grid-cols-3 gap-4 ">
        <div className="p-2 bg-gray-300 mt-2 mb-2 shadow-2xl flex flex-col justify-center w-[200px] h-[100px]">
          <p>
            <strong>Zoning Code:</strong> {property.properties.zoning_code}
          </p>
        </div>

        <div className="p-2 bg-gray-300 mt-2 mb-2 shadow-2xl flex flex-col justify-center w-[200px] h-[100px]">
          <p>
            <h1>{property.properties.street_name}</h1>
          </p>
        </div>

        <div className="p-2 bg-gray-300 mt-2 mb-2 shadow-2xl flex flex-col justify-center w-[200px] h-[100px]">
          <p>
            <strong>Zoning District:</strong>{" "}
            {property.properties.zoning_district}
          </p>
        </div>

        <div className="p-2 bg-gray-300 mt-2 mb-2 shadow-2xl flex flex-col justify-center w-[200px] h-[100px]">
          <p>
            <strong>Block Number:</strong> {property.properties.block_num}
          </p>
        </div>

        <div className="p-2 bg-gray-300 mt-2 mb-2 shadow-2xl flex flex-col justify-center w-[200px] h-[100px]">
          <p>
            <strong>Lot Number:</strong> {property.properties.lot_num}
          </p>
        </div>
      </div>

      {/* ... Add other properties here ... */}
    </div>
  );
};

export default Property;
