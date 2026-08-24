import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GymBro",
    short_name: "GymBro",
    description:
      "Tu compañero de gimnasio: rutinas, entrenamientos y progreso.",
    start_url: "/",
    display: "standalone",
    background_color: "#08090c",
    theme_color: "#08090c",
    lang: "es",
  };
}
