import { config } from "dotenv";
import { connectDB } from "../lib/db.js";
import User from "../models/user.model.js";

config();

const seedUsers = [
  // Female Users
  {
    phoneNumber: "+15550000001",
    fullName: "Emma Thompson",
    profilePic: "https://randomuser.me/api/portraits/women/1.jpg",
  },
  {
    phoneNumber: "+15550000002",
    fullName: "Olivia Miller",
    profilePic: "https://randomuser.me/api/portraits/women/2.jpg",
  },
  {
    phoneNumber: "+15550000003",
    fullName: "Sophia Davis",
    profilePic: "https://randomuser.me/api/portraits/women/3.jpg",
  },
  {
    phoneNumber: "+15550000004",
    fullName: "Ava Wilson",
    profilePic: "https://randomuser.me/api/portraits/women/4.jpg",
  },
  {
    phoneNumber: "+15550000005",
    fullName: "Isabella Brown",
    profilePic: "https://randomuser.me/api/portraits/women/5.jpg",
  },
  {
    phoneNumber: "+15550000006",
    fullName: "Mia Johnson",
    profilePic: "https://randomuser.me/api/portraits/women/6.jpg",
  },
  {
    phoneNumber: "+15550000007",
    fullName: "Charlotte Williams",
    profilePic: "https://randomuser.me/api/portraits/women/7.jpg",
  },
  {
    phoneNumber: "+15550000008",
    fullName: "Amelia Garcia",
    profilePic: "https://randomuser.me/api/portraits/women/8.jpg",
  },

  // Male Users
  {
    phoneNumber: "+15550000011",
    fullName: "James Anderson",
    profilePic: "https://randomuser.me/api/portraits/men/1.jpg",
  },
  {
    phoneNumber: "+15550000012",
    fullName: "William Clark",
    profilePic: "https://randomuser.me/api/portraits/men/2.jpg",
  },
  {
    phoneNumber: "+15550000013",
    fullName: "Benjamin Taylor",
    profilePic: "https://randomuser.me/api/portraits/men/3.jpg",
  },
  {
    phoneNumber: "+15550000014",
    fullName: "Lucas Moore",
    profilePic: "https://randomuser.me/api/portraits/men/4.jpg",
  },
  {
    phoneNumber: "+15550000015",
    fullName: "Henry Jackson",
    profilePic: "https://randomuser.me/api/portraits/men/5.jpg",
  },
  {
    phoneNumber: "+15550000016",
    fullName: "Alexander Martin",
    profilePic: "https://randomuser.me/api/portraits/men/6.jpg",
  },
  {
    phoneNumber: "+15550000017",
    fullName: "Daniel Rodriguez",
    profilePic: "https://randomuser.me/api/portraits/men/7.jpg",
  },
];

const seedDatabase = async () => {
  try {
    await connectDB();

    await User.insertMany(seedUsers);
    console.log("Database seeded successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
};

// Call the function
seedDatabase();
