import p1_img from "./product_1.png";
import p2_img from "./product_2.png";
import p3_img from "./product_3.png";
import p4_img from "./product_4.png";

let data_product = [
  {
    id: 1,
    name: "Haier Double Door Refrigerator (HRF-336 EBS)",
    description:
      "Energy-efficient double door refrigerator with elegant glass finish and fast cooling technology.",
    category: "Refrigerators",
    image: [p1_img, p2_img],
    new_price: 120000,
    old_price: 135000,
    size: ["336L", "300L"],
    color: ["Silver", "Grey"],
  },
  {
    id: 2,
    name: "Dawlance Convection Microwave Oven 30L (DW-131 HP)",
    description:
      "30L microwave oven with convection and grill functions, perfect for baking and roasting.",
    category: "Kitchen Appliances",
    image: [p2_img],
    new_price: 38000,
    old_price: 45000,
    size: ["30L", "32L"],
    color: ["Black", "Silver"],
  },
  {
    id: 3,
    name: "Samsung Front Load Washing Machine 8KG (WW80T)",
    description:
      "Smart front-load washer with eco-bubble technology for deep cleaning and fabric care.",
    category: "Washing Machines",
    image: [p3_img],
    new_price: 145000,
    old_price: 160000,
    size: ["8KG", "7KG"],
    color: ["White", "Silver"],
  },
  {
    id: 4,
    name: "PEL 4-Burner Glass Top Gas Hob (PGH-4G)",
    description:
      "Stylish 4-burner gas hob with tempered glass and auto ignition for efficient cooking.",
    category: "Kitchen Appliances",
    image: [p4_img],
    new_price: 32000,
    old_price: 37000,
    size: ["Standard", "Large"],
    color: ["Black", "Silver"],
  },
];

export default data_product;
