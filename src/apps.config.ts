export type AppStatus = "ONLINE" | "IN PROGRESS" | "COMING SOON";

export interface AppEntry {
  name: string;
  url?: string;
  status: AppStatus;
  description: string;
  icon: string;
}

export interface CategoryGroup {
  name: string;
  emoji: string;
  apps: AppEntry[];
}

export const categories: CategoryGroup[] = [
  {
    name: "Finance & Analysis",
    emoji: "📊",
    apps: [
      { name: "GoldenEye XIRR", url: "https://goldeneye-xirr.vercel.app", status: "ONLINE", description: "XIRR calculator — investment return intelligence", icon: "🎯" },
      { name: "Parker Street Bonds", url: "https://parker-street-bonds.vercel.app", status: "ONLINE", description: "Bond analysis and fixed income tools", icon: "📈" },
      { name: "Errbody Got Choices", url: "https://errbody-got-choices.vercel.app", status: "ONLINE", description: "Hierarchy finder and decision mapping", icon: "🔀" },
    ],
  },
  {
    name: "Property & Hospitality",
    emoji: "🏨",
    apps: [
      { name: "Mayfair Portfolio", url: "https://mayfair-portfolio.vercel.app", status: "ONLINE", description: "Real estate portfolio management", icon: "🏠" },
      { name: "That Lakeland Hotel", status: "COMING SOON", description: "Lakeland hospitality operations", icon: "🏨" },
    ],
  },
  {
    name: "Education & Learning",
    emoji: "📚",
    apps: [
      { name: "Learning Apps", url: "https://learning-apps.vercel.app", status: "ONLINE", description: "Educational tools and interactive learning", icon: "📖" },
      { name: "Addressing Alzheimer's", status: "IN PROGRESS", description: "Alzheimer's awareness and education", icon: "🧠" },
      { name: "Sphere Planning Guide", status: "COMING SOON", description: "Strategic planning framework", icon: "🌐" },
    ],
  },
  {
    name: "Operations",
    emoji: "⚙️",
    apps: [
      { name: "Barnett Automated Services", url: "https://barnett-automated-services.vercel.app", status: "ONLINE", description: "BASeD automation hub", icon: "🤖" },
      { name: "Barnett Office", url: "https://barnett-office.vercel.app", status: "ONLINE", description: "The original office portal", icon: "🏢" },
      { name: "ClawBot Manual", status: "IN PROGRESS", description: "OpenClaw instruction manual", icon: "🦞" },
    ],
  },
  {
    name: "Events & Utilities",
    emoji: "🎉",
    apps: [
      { name: "Black Tie Seating", url: "https://black-tie-seating.vercel.app", status: "ONLINE", description: "Event seating arrangements", icon: "🎩" },
      { name: "Revival Classic Cocktails", url: "https://revival-classic-cocktails.vercel.app", status: "ONLINE", description: "Classic cocktail recipes and service", icon: "🍸" },
    ],
  },
  {
    name: "Research & History",
    emoji: "🔬",
    apps: [
      { name: "Bell Family History", status: "COMING SOON", description: "Genealogy and family research", icon: "🌳" },
      { name: "Dirty Data Boyz", status: "COMING SOON", description: "Data analysis and cleanup", icon: "🧹" },
      { name: "Lakeland RPG", status: "COMING SOON", description: "Lakeland adventure game", icon: "🎮" },
    ],
  },
];
