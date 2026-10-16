// Local entry anchor: re-export keeps Metro's entry inside the project root.
// (Resolving expo-router/entry directly can escape into the pnpm store,
// which Metro on Windows cannot map back.)
import "expo-router/entry";
