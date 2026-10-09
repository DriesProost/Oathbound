import { Castle, DoorOpen, Wind } from "lucide-react";
// Presentation metadata, separate from walking rewards and persisted distance.
export const landmarks = [
  {
    name: "Your Keep",
    km: 0,
    x: 70,
    y: 260,
    icon: Castle,
    inscription: "The gate stands behind you. The road lies ahead.",
  },
  {
    name: "Old Mill",
    km: 9,
    x: 195,
    y: 165,
    icon: Wind,
    inscription: "The old wheel turns steadily beside the stream.",
  },
  {
    name: "Wayfarer’s Inn",
    km: 21,
    x: 425,
    y: 230,
    icon: DoorOpen,
    inscription: "A warm hearth welcomes a weary traveller.",
  },
  {
    name: "Oakhaven",
    km: 30,
    x: 560,
    y: 100,
    icon: Castle,
    inscription: "Beyond the oaks, the village gate comes into view.",
  },
];
