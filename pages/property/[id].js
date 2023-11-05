import { useRouter } from "next/router";

const Property = () => {
  const router = useRouter();
  const { id } = router.query;

  // For now, let's use mock data. In a real-world scenario, you'd fetch the property details using this ID.
  const property = {
    name: "Sample Property",
    zoning_code: "RH-1",
    zoning_district: "Residential - House",
    block_num: "12345",
    lot_num: "67890",
    property_value: "$500,000",
  };

  return (
    <div className="p-2 mt-2">
      <button onClick={() => router.back()}>Back to Map</button>
      <h1>{property.name}</h1>
      <p>
        <strong>Zoning Code:</strong> {property.zoning_code}
      </p>
      <p>
        <strong>Zoning District:</strong> {property.zoning_district}
      </p>
      <p>
        <strong>Block Number:</strong> {property.block_num}
      </p>
      <p>
        <strong>Lot Number:</strong> {property.lot_num}
      </p>
      <p>
        <strong>Property Value:</strong> {property.property_value}
      </p>
    </div>
  );
};

export default Property;
